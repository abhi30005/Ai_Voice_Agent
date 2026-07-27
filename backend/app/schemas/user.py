from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    avatar: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

class UserInDB(UserResponse):
    password_hash: str
