from pydantic import BaseModel
from datetime import datetime

class DocumentBase(BaseModel):
    filename: str
    file_path: str
    indexed: bool = False

class DocumentResponse(DocumentBase):
    id: str
    user_id: str
    created_at: datetime
