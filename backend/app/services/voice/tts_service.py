from app.config import settings
from app.core.logging import logger
import io
import httpx

class TTSService:
    def __init__(self):
        self.provider = settings.TTS_PROVIDER.lower()
        self.elevenlabs_api_key = settings.ELEVENLABS_API_KEY
        self.elevenlabs_voice_id = settings.ELEVENLABS_VOICE_ID
        
        if self.provider == "elevenlabs":
            if not self.elevenlabs_api_key:
                logger.warning("ElevenLabs API key is not set! Falling back to gTTS.")
                self.provider = "gtts"
            else:
                logger.info("Configured TTS provider: elevenlabs")
        elif self.provider == "gtts":
            logger.info("Configured TTS provider: gtts (Google Text-to-Speech)")
        else:
            logger.info(f"Configured TTS provider: {self.provider}, falling back to gtts")
            self.provider = "gtts"

    def synthesize(self, text: str) -> bytes:
        """
        Synthesizes text to an MP3 audio buffer.
        Falls back through providers: elevenlabs → gtts → silent wav
        """
        if self.provider == "elevenlabs":
            audio = self._elevenlabs_audio(text)
            if audio and not self._is_silent_wav(audio):
                return audio
            # ElevenLabs failed, fall through to gTTS
            logger.warning("ElevenLabs failed, falling back to gTTS")
        
        # Try gTTS (free Google TTS)
        audio = self._gtts_audio(text)
        if audio:
            return audio
            
        # Last resort: silent WAV
        logger.warning("All TTS providers failed, returning silent audio")
        return self._silent_wav()
    
    def _is_silent_wav(self, audio: bytes) -> bool:
        """Check if audio is our silent WAV fallback."""
        return audio[:4] == b'RIFF' and len(audio) < 40000
            
    def _elevenlabs_audio(self, text: str) -> bytes:
        if not self.elevenlabs_api_key:
            return self._silent_wav()
            
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.elevenlabs_voice_id}?output_format=mp3_44100_128"
        headers = {
            "xi-api-key": self.elevenlabs_api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "model_id": "eleven_flash_v2_5",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        
        try:
            with httpx.Client() as client:
                response = client.post(url, json=payload, headers=headers, timeout=30.0)
                if response.status_code == 200:
                    logger.info(f"ElevenLabs TTS success: {len(response.content)} bytes")
                    return response.content
                else:
                    logger.error(f"ElevenLabs TTS error: {response.status_code} - {response.text}")
                    return self._silent_wav()
        except Exception as e:
            logger.error(f"ElevenLabs TTS exception: {e}")
            return self._silent_wav()

    def _gtts_audio(self, text: str) -> bytes | None:
        """Google Text-to-Speech — free, no API key needed. Returns MP3 bytes."""
        try:
            from gtts import gTTS
            
            tts = gTTS(text=text, lang='en', slow=False)
            mp3_buffer = io.BytesIO()
            tts.write_to_fp(mp3_buffer)
            mp3_bytes = mp3_buffer.getvalue()
            
            logger.info(f"gTTS success: {len(mp3_bytes)} bytes")
            return mp3_bytes
        except ImportError:
            logger.error("gTTS not installed. Run: pip install gTTS")
            return None
        except Exception as e:
            logger.error(f"gTTS error: {e}")
            return None

    def _silent_wav(self) -> bytes:
        """Generate 1 second of silence as WAV (last resort fallback)."""
        import wave
        import numpy as np
        
        sample_rate = 16000
        num_samples = sample_rate
        audio_data = np.zeros(num_samples, dtype=np.int16)
        
        wav_io = io.BytesIO()
        with wave.open(wav_io, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_data.tobytes())
            
        return wav_io.getvalue()

tts_service = TTSService()
