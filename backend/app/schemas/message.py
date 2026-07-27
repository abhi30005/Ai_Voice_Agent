from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class MessageBase(BaseModel):
    role: str # "user" or "assistant"
    content: str
    transcript: Optional[str] = None
    audio_metadata: Optional[Dict[str, Any]] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None

class MessageCreate(MessageBase):
    conversation_id: str

class MessageResponse(MessageBase):
    id: str
    conversation_id: str
    created_at: datetime
