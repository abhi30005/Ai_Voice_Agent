from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.core.exceptions import register_exception_handlers
from app.core.logging import logger

from app.api.routes import auth, conversations, voice, documents

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(auth.router)
app.include_router(conversations.router)
app.include_router(voice.router)
app.include_router(documents.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "database": "connected" if connect_to_mongo else "unknown", 
        "services": {
            "stt": "unknown",
            "llm": "unknown",
            "tts": "unknown"
        }
    }
