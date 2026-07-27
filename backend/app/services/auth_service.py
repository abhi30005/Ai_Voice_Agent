from datetime import datetime, timezone
from bson import ObjectId
from app.database.mongodb import db
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password
from fastapi import HTTPException, status

async def create_user(user: UserCreate):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "name": user.name,
        "email": user.email,
        "password_hash": hashed_password,
        "avatar": None,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    return user_dict

async def authenticate_user(email: str, password: str):
    user = await db.users.find_one({"email": email})
    if not user:
        return False
    if not verify_password(password, user["password_hash"]):
        return False
    user["id"] = str(user["_id"])
    return user
