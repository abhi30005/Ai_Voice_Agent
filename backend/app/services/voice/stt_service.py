import io
import wave
from openai import AsyncOpenAI
from app.config import settings
from app.core.logging import logger

class STTService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        if self.api_key:
            self.client = AsyncOpenAI(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("OPENAI_API_KEY is not set! STT will fail.")

    async def transcribe(self, audio_data: bytes, sample_rate: int = 16000) -> str:
        """
        Transcribe raw 16-bit PCM audio bytes to text using OpenAI Whisper API.
        
        Args:
            audio_data: Raw PCM audio bytes (16-bit signed integer, mono)
            sample_rate: Sample rate of the audio (default 16000)
            
        Returns:
            Transcribed text string, or empty string if nothing detected.
        """
        if not self.client:
            logger.error("Cannot transcribe: OpenAI client is not initialized.")
            return ""
            
        if len(audio_data) < 1600:  # Less than 0.05 seconds at 16kHz
            logger.warning("Audio data too short for transcription")
            return ""
            
        try:
            # Construct a WAV file in memory
            wav_io = io.BytesIO()
            with wave.open(wav_io, 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(audio_data)
            
            wav_io.name = "audio.wav"
            wav_io.seek(0)
            
            logger.info(f"Sending audio to OpenAI Whisper API: {len(audio_data)} bytes")
            
            # Send to OpenAI API
            response = await self.client.audio.transcriptions.create(
                model="whisper-1",
                file=wav_io,
                language="en",
                response_format="text"
            )
            
            result = response.strip()
            logger.info(f"OpenAI Whisper result: '{result}'")
            return result
            
        except Exception as e:
            logger.error(f"OpenAI Whisper Transcription error: {e}", exc_info=True)
            return ""

# The module exports an instance, but we can't await __init__, so we'll just 
# rely on the transcribe method which is async.
stt_service = STTService()
