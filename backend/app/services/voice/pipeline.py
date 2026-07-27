import asyncio
import base64
import time
import numpy as np
from fastapi import WebSocket
from langchain_core.messages import HumanMessage
from app.services.voice.vad_service import vad_service
from app.services.voice.stt_service import stt_service
from app.services.voice.tts_service import tts_service
from app.services.agent.agent import agent_app
from app.services.agent.state import AgentState
from app.core.logging import logger
from app.database.mongodb import db
from bson import ObjectId


class VoicePipeline:
    """
    Real-time voice conversation pipeline.
    
    Flow: Audio chunks → Buffer → (silence timeout) → STT → Agent → TTS → Audio response
    
    Uses a silence-timeout approach: accumulates audio while speech is detected,
    then triggers the pipeline after a configurable period of silence.
    """
    
    # How long silence must persist before we process the buffer (seconds)
    SILENCE_TIMEOUT = 1.5
    # Minimum audio duration to bother transcribing (seconds at 16kHz, 16-bit mono)
    MIN_AUDIO_DURATION = 0.5
    MIN_AUDIO_BYTES = int(16000 * 2 * MIN_AUDIO_DURATION)  # 16000 samples/sec * 2 bytes/sample * duration
    
    def __init__(self, websocket: WebSocket, conversation_id: str, user_id: str):
        self.websocket = websocket
        self.conversation_id = conversation_id
        self.user_id = user_id
        self.audio_buffer = bytearray()
        self.is_processing = False
        self.current_task: asyncio.Task | None = None
        self.messages_state = {"messages": []}  # In-memory conversation state
        
        # TTS toggle — when False, skip audio synthesis (text-only responses)
        self.tts_enabled = True
        
        # Silence detection state
        self._has_speech = False
        self._last_speech_time: float = 0.0
        self._silence_timer_task: asyncio.Task | None = None

    async def process_audio_chunk(self, data: str):
        """Process incoming base64 audio chunk from client."""
        try:
            chunk_bytes = base64.b64decode(data)
            
            # Convert bytes to numpy float32 for VAD (16kHz 16-bit PCM)
            audio_np = np.frombuffer(chunk_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            
            speech_detected = vad_service.detect_speech(audio_np)
            
            if speech_detected:
                # If AI is currently speaking and user starts talking, barge in
                if self.is_processing and self.current_task:
                    await self._handle_barge_in()
                
                self._has_speech = True
                self._last_speech_time = time.monotonic()
                self.audio_buffer.extend(chunk_bytes)
                
                # Cancel any pending silence timer
                if self._silence_timer_task and not self._silence_timer_task.done():
                    self._silence_timer_task.cancel()
                    self._silence_timer_task = None
                    
            elif self._has_speech:
                # Still accumulate audio during brief pauses (might be between words)
                self.audio_buffer.extend(chunk_bytes)
                
                # Start/restart silence timer if not already running
                if self._silence_timer_task is None or self._silence_timer_task.done():
                    self._silence_timer_task = asyncio.create_task(
                        self._silence_timeout_handler()
                    )
                    
        except Exception as e:
            logger.error(f"Error processing audio chunk: {e}", exc_info=True)
            try:
                await self.websocket.send_json({"type": "error", "message": "Audio processing failed"})
            except Exception:
                pass

    async def _silence_timeout_handler(self):
        """Wait for silence timeout, then trigger the pipeline."""
        try:
            await asyncio.sleep(self.SILENCE_TIMEOUT)
            
            # Double-check we still have speech data and silence has persisted
            elapsed = time.monotonic() - self._last_speech_time
            if self._has_speech and elapsed >= self.SILENCE_TIMEOUT:
                logger.info(f"Silence timeout reached ({elapsed:.1f}s). Processing audio buffer.")
                await self._trigger_stt_and_agent()
        except asyncio.CancelledError:
            pass  # Timer was cancelled because speech resumed

    async def handle_stop_recording(self):
        """Called when user explicitly stops recording (presses the button)."""
        # Cancel any pending silence timer
        if self._silence_timer_task and not self._silence_timer_task.done():
            self._silence_timer_task.cancel()
            self._silence_timer_task = None
        
        if self._has_speech and len(self.audio_buffer) > 0:
            logger.info("User stopped recording. Processing audio buffer.")
            await self._trigger_stt_and_agent()
        else:
            # Reset state even if no speech detected
            self._has_speech = False
            self.audio_buffer.clear()

    async def handle_text_message(self, text: str):
        """Process a text message directly (skip STT)."""
        if not text.strip():
            return
            
        if self.is_processing:
            await self._handle_barge_in()
        
        self.is_processing = True
        self.current_task = asyncio.create_task(
            self._run_agent_and_tts(text.strip())
        )

    async def _handle_barge_in(self):
        """Handle user interrupting the AI."""
        if self.is_processing and self.current_task:
            logger.info("Barge-in detected, cancelling current response...")
            self.current_task.cancel()
            self.is_processing = False
            try:
                await self.websocket.send_json({"type": "speaking_finished"})
            except Exception:
                pass

    async def _trigger_stt_and_agent(self):
        """Trigger the STT → Agent → TTS flow."""
        if len(self.audio_buffer) < self.MIN_AUDIO_BYTES:
            logger.info(f"Audio buffer too short ({len(self.audio_buffer)} bytes < {self.MIN_AUDIO_BYTES}). Skipping.")
            self._has_speech = False
            self.audio_buffer.clear()
            return
            
        audio_data = bytes(self.audio_buffer)
        self.audio_buffer.clear()
        self._has_speech = False
        
        self.is_processing = True
        self.current_task = asyncio.create_task(self._run_pipeline(audio_data))

    async def _run_pipeline(self, audio_data: bytes):
        """Full pipeline: STT → Agent → TTS."""
        try:
            # 1. STT — Transcribe audio to text
            logger.info(f"Transcribing audio frame: {len(audio_data)} bytes")
            transcript = await stt_service.transcribe(audio_data)
            
            if not transcript:
                logger.info("STT returned empty transcript. Skipping.")
                self.is_processing = False
                await self.websocket.send_json({"type": "thinking_done"})
                await self.websocket.send_json({"type": "error", "message": "Could not understand audio. Please try again."})
                return
                
            logger.info(f"Transcript: {transcript}")
            await self.websocket.send_json({"type": "transcript", "text": transcript})
            
            # 2. Agent → TTS
            await self._run_agent_and_tts(transcript)
            
        except asyncio.CancelledError:
            logger.info("Pipeline task cancelled due to barge-in.")
        except Exception as e:
            logger.error(f"Pipeline error: {e}", exc_info=True)
            try:
                await self.websocket.send_json({"type": "error", "message": f"Processing failed: {str(e)}"})
            except Exception:
                pass
        finally:
            self.is_processing = False

    async def _run_agent_and_tts(self, text: str):
        """Agent → TTS portion of the pipeline (shared by voice and text input)."""
        try:
            # 1. Run the AI agent
            self.messages_state["messages"].append(HumanMessage(content=text))
            
            new_state = await asyncio.to_thread(agent_app.invoke, self.messages_state)
            self.messages_state = new_state
            
            response_msg = self.messages_state["messages"][-1]
            response_text = response_msg.content
            
            logger.info(f"Agent response: {response_text[:100]}...")
            await self.websocket.send_json({"type": "response_text", "text": response_text})
            
            # 2. TTS — Convert response to audio (only if TTS is enabled)
            if self.tts_enabled:
                await self.websocket.send_json({"type": "speaking_started"})
                
                # Fetch user's voice preference
                voice_name = "alloy"
                try:
                    if self.user_id != "test_user_id":
                        settings_doc = await db.settings.find_one({"user_id": ObjectId(self.user_id)})
                        if settings_doc and "voice" in settings_doc:
                            voice_name = settings_doc["voice"].get("voice_id", "alloy")
                except Exception as e:
                    logger.error(f"Failed to fetch voice settings for user {self.user_id}: {e}")
                
                tts_audio = await asyncio.to_thread(tts_service.synthesize, response_text, voice_name)
                
                if tts_audio and len(tts_audio) > 0:
                    b64_audio = base64.b64encode(tts_audio).decode('utf-8')
                    await self.websocket.send_json({"type": "audio_chunk", "data": b64_audio})
                
                await self.websocket.send_json({"type": "speaking_finished"})
            
        except asyncio.CancelledError:
            logger.info("Agent/TTS task cancelled due to barge-in.")
            raise  # Re-raise so the caller knows it was cancelled
        except Exception as e:
            logger.error(f"Agent/TTS error: {e}", exc_info=True)
            try:
                await self.websocket.send_json({"type": "error", "message": f"Response failed: {str(e)}"})
            except Exception:
                pass
        finally:
            self.is_processing = False
