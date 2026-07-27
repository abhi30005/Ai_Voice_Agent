from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from app.services.voice.pipeline import VoicePipeline
from app.core.logging import logger
from app.api.dependencies import get_current_user
from jose import jwt
from app.config import settings

router = APIRouter(prefix="/api/voice", tags=["voice"])

async def get_ws_user(token: str):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload.get("sub")
    except Exception:
        return None

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None), conversation_id: str = Query("default")):
    # For testing: Bypass strict JWT check
    user = await get_ws_user(token) if token else "test_user_id"
    if not user:
        user = "test_user_id"
        
    await websocket.accept()
    pipeline = VoicePipeline(websocket, conversation_id)
    logger.info(f"WebSocket connected for conversation {conversation_id}, user {user}")
    
    try:
        while True:
            message = await websocket.receive_json()
            msg_type = message.get("type")
            
            if msg_type == "audio_chunk":
                data = message.get("data")
                if data:
                    await pipeline.process_audio_chunk(data)
                    
            elif msg_type == "stop_recording":
                # User pressed the stop/mute button — process whatever is buffered
                await pipeline.handle_stop_recording()
                
            elif msg_type == "text_message":
                # User typed a message — skip STT, go straight to Agent → TTS
                text = message.get("text", "")
                if text.strip():
                    await pipeline.handle_text_message(text)
                    
            elif msg_type == "stop_audio":
                await pipeline._handle_barge_in()
                
            elif msg_type == "set_tts":
                # Toggle TTS on/off
                pipeline.tts_enabled = bool(message.get("enabled", True))
                logger.info(f"TTS {'enabled' if pipeline.tts_enabled else 'disabled'} for conversation {conversation_id}")
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for conversation {conversation_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        try:
            await websocket.close()
        except Exception:
            pass
