import io
import numpy as np
from faster_whisper import WhisperModel
from app.config import settings
from app.core.logging import logger

class STTService:
    def __init__(self):
        self.model = None
        self.device = settings.WHISPER_DEVICE
        self.compute_type = settings.WHISPER_COMPUTE_TYPE
        self.model_size = settings.WHISPER_MODEL

    def load_model(self):
        if self.model is None:
            logger.info(f"Loading Faster Whisper model: {self.model_size} on {self.device} with {self.compute_type}")
            self.model = WhisperModel(
                self.model_size,
                device=self.device,
                compute_type=self.compute_type
            )
            logger.info("Faster Whisper model loaded.")

    def transcribe(self, audio_data: bytes, sample_rate: int = 16000) -> str:
        """
        Transcribe raw 16-bit PCM audio bytes to text.
        
        Args:
            audio_data: Raw PCM audio bytes (16-bit signed integer, mono)
            sample_rate: Sample rate of the audio (default 16000)
            
        Returns:
            Transcribed text string, or empty string if nothing detected.
        """
        if self.model is None:
            self.load_model()
        
        if len(audio_data) < 1600:  # Less than 0.05 seconds at 16kHz
            logger.warning("Audio data too short for transcription")
            return ""
            
        # Convert raw 16-bit PCM bytes to 1D float32 numpy array
        audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
        
        # Check if audio has any meaningful content
        rms = np.sqrt(np.mean(audio_np ** 2))
        if rms < 0.005:
            logger.info(f"Audio RMS too low ({rms:.4f}), likely silence. Skipping transcription.")
            return ""
        
        logger.info(f"Transcribing audio: {len(audio_np)} samples ({len(audio_np)/sample_rate:.1f}s), RMS={rms:.4f}")
        
        try:
            segments, info = self.model.transcribe(
                audio_np, 
                beam_size=5,
                language="en",
                vad_filter=True,  # Use whisper's built-in VAD to filter silence
            )
            text = " ".join([segment.text for segment in segments])
            result = text.strip()
            logger.info(f"Transcription result: '{result}'")
            return result
        except Exception as e:
            logger.error(f"Transcription error: {e}", exc_info=True)
            return ""

stt_service = STTService()
