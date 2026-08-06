import asyncio
import base64
from fastapi import WebSocket
from langchain_core.messages import HumanMessage
from app.services.voice.tts_service import tts_service
from app.services.agent.agent import agent_app
from app.core.logging import logger
from app.database.mongodb import db
from bson import ObjectId


class VoicePipeline:
    """
    Real-time voice conversation pipeline.
    
    Flow: Text Message → Agent → TTS → Audio response
    
    This pipeline now assumes STT is handled by the client-side Web Speech API,
    so it only needs to receive text messages and stream the AI's response audio back.
    """
    
    def __init__(self, websocket: WebSocket, conversation_id: str, user_id: str):
        self.websocket = websocket
        self.conversation_id = conversation_id
        self.user_id = user_id
        self.is_processing = False
        self.current_task: asyncio.Task | None = None
        self.messages_state = {"messages": []}  # In-memory conversation state
        
        # TTS toggle — when False, skip audio synthesis (text-only responses)
        self.tts_enabled = True

    async def handle_text_message(self, text: str):
        """Process a text message (received from STT frontend)."""
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

    async def _run_agent_and_tts(self, text: str):
        """Agent → TTS portion of the pipeline."""
        try:
            # 1. Run the AI agent
            self.messages_state["messages"].append(HumanMessage(content=text))
            self.messages_state["user_id"] = self.user_id
            
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
