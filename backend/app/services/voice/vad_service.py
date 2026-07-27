import numpy as np
from app.core.logging import logger

class VADService:
    """
    Simple energy-based Voice Activity Detection.
    Uses RMS energy of audio chunks to determine if speech is present.
    Much more reliable on small real-time chunks than model-based VAD.
    """
    def __init__(self, energy_threshold: float = 0.015, min_speech_ratio: float = 0.3):
        """
        Args:
            energy_threshold: RMS energy threshold above which audio is considered speech.
                              Typical values: 0.01-0.03 for normalized float32 audio.
            min_speech_ratio: Minimum ratio of "loud" frames in the chunk to consider it speech.
        """
        self.energy_threshold = energy_threshold
        self.min_speech_ratio = min_speech_ratio
        logger.info(f"VAD initialized: energy_threshold={energy_threshold}, min_speech_ratio={min_speech_ratio}")

    def detect_speech(self, audio_data: np.ndarray, sample_rate: int = 16000) -> bool:
        """
        Detects if speech is present in the audio chunk using RMS energy.
        
        Args:
            audio_data: 1D numpy array of float32 PCM audio (-1.0 to 1.0)
            sample_rate: Sample rate (unused but kept for API compatibility)
            
        Returns:
            True if speech is detected, False otherwise.
        """
        if len(audio_data) == 0:
            return False
        
        # Calculate RMS energy of the chunk
        rms = np.sqrt(np.mean(audio_data ** 2))
        
        # Also check what fraction of samples exceed the threshold
        # This helps distinguish speech from brief clicks/pops
        frame_size = max(1, len(audio_data) // 10)  # Split into ~10 frames
        loud_frames = 0
        total_frames = 0
        
        for i in range(0, len(audio_data), frame_size):
            frame = audio_data[i:i + frame_size]
            frame_rms = np.sqrt(np.mean(frame ** 2))
            total_frames += 1
            if frame_rms > self.energy_threshold:
                loud_frames += 1
        
        speech_ratio = loud_frames / max(1, total_frames)
        is_speech = rms > self.energy_threshold and speech_ratio >= self.min_speech_ratio
        
        return is_speech

vad_service = VADService()
