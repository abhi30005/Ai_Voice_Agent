from pydantic import BaseModel
from typing import Optional

class VoiceMessage(BaseModel):
    type: str
    data: Optional[str] = None
    text: Optional[str] = None
    message: Optional[str] = None
