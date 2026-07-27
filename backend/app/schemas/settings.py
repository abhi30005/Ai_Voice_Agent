from pydantic import BaseModel
from typing import Optional

class ProviderSettings(BaseModel):
    openai_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    elevenlabs_api_key: Optional[str] = None

class AgentSettings(BaseModel):
    system_prompt: Optional[str] = None
    primary_model: Optional[str] = None
    temperature: Optional[float] = None
    allow_interruption: Optional[bool] = None

class VoiceSettings(BaseModel):
    voice_id: Optional[str] = None
    speaking_rate: Optional[int] = None

class SettingsUpdate(BaseModel):
    providers: Optional[ProviderSettings] = None
    agent: Optional[AgentSettings] = None
    voice: Optional[VoiceSettings] = None

class SettingsResponse(SettingsUpdate):
    user_id: str
