from datetime import datetime, timezone
from bson import ObjectId
from app.database.mongodb import db
from app.schemas.conversation import ConversationCreate
from app.schemas.message import MessageCreate
from fastapi import HTTPException, status

async def create_conversation(user_id: str, conv: ConversationCreate):
    conv_dict = {
        "user_id": ObjectId(user_id),
        "title": conv.title,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    result = await db.conversations.insert_one(conv_dict)
    conv_dict["id"] = str(result.inserted_id)
    conv_dict["user_id"] = str(conv_dict["user_id"])
    return conv_dict

async def get_conversations(user_id: str):
    cursor = db.conversations.find({"user_id": ObjectId(user_id)}).sort("updated_at", -1)
    conversations = []
    async for conv in cursor:
        conv["id"] = str(conv["_id"])
        conv["user_id"] = str(conv["user_id"])
        conversations.append(conv)
    return conversations

async def get_conversation(user_id: str, conv_id: str):
    conv = await db.conversations.find_one({"_id": ObjectId(conv_id), "user_id": ObjectId(user_id)})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv["id"] = str(conv["_id"])
    conv["user_id"] = str(conv["user_id"])
    return conv

async def delete_conversation(user_id: str, conv_id: str):
    result = await db.conversations.delete_one({"_id": ObjectId(conv_id), "user_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.messages.delete_many({"conversation_id": ObjectId(conv_id)})
    return {"status": "deleted"}

async def create_message(user_id: str, msg: MessageCreate):
    # Verify conversation belongs to user
    await get_conversation(user_id, msg.conversation_id)
    
    msg_dict = {
        "conversation_id": ObjectId(msg.conversation_id),
        "role": msg.role,
        "content": msg.content,
        "transcript": msg.transcript,
        "audio_metadata": msg.audio_metadata,
        "tool_calls": msg.tool_calls,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.messages.insert_one(msg_dict)
    msg_dict["id"] = str(result.inserted_id)
    msg_dict["conversation_id"] = str(msg_dict["conversation_id"])
    
    # Update conversation updated_at
    await db.conversations.update_one(
        {"_id": ObjectId(msg.conversation_id)},
        {"$set": {"updated_at": datetime.now(timezone.utc)}}
    )
    
    return msg_dict

async def get_messages(user_id: str, conv_id: str):
    # Verify ownership
    await get_conversation(user_id, conv_id)
    
    cursor = db.messages.find({"conversation_id": ObjectId(conv_id)}).sort("created_at", 1)
    messages = []
    async for msg in cursor:
        msg["id"] = str(msg["_id"])
        msg["conversation_id"] = str(msg["conversation_id"])
        messages.append(msg)
    return messages
