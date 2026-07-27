from fastapi import APIRouter, Depends, HTTPException
from app.schemas.settings import SettingsUpdate, SettingsResponse
from app.api.dependencies import get_current_active_user
from app.database.mongodb import db
from bson import ObjectId

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("", response_model=SettingsResponse)
async def get_settings(current_user: dict = Depends(get_current_active_user)):
    user_id = current_user["id"]
    settings_doc = await db.settings.find_one({"user_id": ObjectId(user_id)})
    
    if not settings_doc:
        # Return default empty settings
        return {"user_id": user_id}
        
    settings_doc["user_id"] = str(settings_doc["user_id"])
    return settings_doc

@router.post("", response_model=SettingsResponse)
async def update_settings(settings: SettingsUpdate, current_user: dict = Depends(get_current_active_user)):
    user_id = current_user["id"]
    update_data = settings.dict(exclude_unset=True)
    
    await db.settings.update_one(
        {"user_id": ObjectId(user_id)},
        {"$set": update_data},
        upsert=True
    )
    
    updated_doc = await db.settings.find_one({"user_id": ObjectId(user_id)})
    updated_doc["user_id"] = str(updated_doc["user_id"])
    return updated_doc
