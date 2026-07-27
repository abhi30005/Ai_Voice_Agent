import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "AI Voice Agent"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me"

    MONGODB_URI: str = ""
    MONGODB_DATABASE: str = "ai_voice_agent"

    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    LLM_PROVIDER: str = "openai"
    LLM_MODEL: str = "gpt-4o-mini"
    OLLAMA_BASE_URL: str = ""

    GROQ_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    STT_PROVIDER: str = "faster-whisper"
    WHISPER_MODEL: str = "tiny"
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"

    TTS_PROVIDER: str = "gtts"
    TTS_VOICE: str = "af_heart"
    TTS_SPEED: float = 1.0
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = ""

    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8000

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
