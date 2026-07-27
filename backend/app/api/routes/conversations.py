from fastapi import APIRouter, Depends
from typing import List
from app.schemas.conversation import ConversationCreate, ConversationResponse
from app.schemas.message import MessageResponse
from app.services import conversation_service
from app.api.dependencies import get_current_active_user

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

@router.post("", response_model=ConversationResponse)
async def create_conversation(conv: ConversationCreate, current_user: dict = Depends(get_current_active_user)):
    return await conversation_service.create_conversation(current_user["id"], conv)

@router.get("", response_model=List[ConversationResponse])
async def get_conversations(current_user: dict = Depends(get_current_active_user)):
    return await conversation_service.get_conversations(current_user["id"])

@router.get("/{conv_id}", response_model=ConversationResponse)
async def get_conversation(conv_id: str, current_user: dict = Depends(get_current_active_user)):
    return await conversation_service.get_conversation(current_user["id"], conv_id)

@router.delete("/{conv_id}")
async def delete_conversation(conv_id: str, current_user: dict = Depends(get_current_active_user)):
    return await conversation_service.delete_conversation(current_user["id"], conv_id)

@router.get("/{conv_id}/messages", response_model=List[MessageResponse])
async def get_messages(conv_id: str, current_user: dict = Depends(get_current_active_user)):
    return await conversation_service.get_messages(current_user["id"], conv_id)
