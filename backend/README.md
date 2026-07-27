# 🧠 AI Voice Agent — Backend

The backend for the AI Voice Agent, built with **FastAPI**, **LangGraph**, and **faster-whisper**. It orchestrates the full voice pipeline: real-time audio streaming → speech-to-text → LLM agent reasoning → text-to-speech → audio playback.

## ✨ Features

- **WebSocket voice streaming** — Real-time bidirectional audio communication
- **Voice Activity Detection** — Silero VAD for accurate speech boundary detection
- **Speech-to-Text** — Local transcription via faster-whisper (configurable model sizes)
- **LLM Agent** — LangGraph-powered agent with tool calling and RAG capabilities
- **Text-to-Speech** — ElevenLabs integration (+ extensible TTS provider interface)
- **JWT Authentication** — Secure API endpoints and WebSocket connections
- **Conversation Memory** — Persistent chat history stored in MongoDB
- **Vector Search (RAG)** — ChromaDB for document embeddings and retrieval
- **Docker Support** — Docker Compose setup for MongoDB, ChromaDB, and the API

## 🏗️ Architecture

```
Audio Input → Silero VAD → faster-whisper (STT) → LangGraph Agent → LLM (Groq/OpenAI) → ElevenLabs (TTS) → Audio Output
```

## 🛠️ Tech Stack

| Layer          | Technology                         |
| -------------- | ---------------------------------- |
| Framework      | FastAPI + Uvicorn                  |
| Agent          | LangGraph, LangChain              |
| LLM Providers  | OpenAI, Groq, Ollama (local)      |
| Speech-to-Text | faster-whisper (Whisper)           |
| Text-to-Speech | ElevenLabs, gTTS                   |
| VAD            | Silero VAD                         |
| Database       | MongoDB (via Motor async driver)   |
| Vector Store   | ChromaDB + sentence-transformers  |
| Auth           | JWT (python-jose + passlib)        |
| Containerization | Docker, Docker Compose           |

## 📋 Prerequisites

- **Python** 3.12+
- **ffmpeg** installed on the system (for audio processing)
- **Docker & Docker Compose** (for MongoDB and ChromaDB)
- Backend API keys configured (see Environment Variables below)

## 🚀 Getting Started

### 1. Create and activate a virtual environment

```bash
cd backend
python -m venv venv

# Linux / macOS
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

| Variable                    | Description                          | Default             |
| --------------------------- | ------------------------------------ | ------------------- |
| `APP_NAME`                  | Application name                     | AI Voice Agent      |
| `ENVIRONMENT`               | Runtime environment                  | development         |
| `SECRET_KEY`                | App secret key                       | *(change-me)*       |
| `MONGODB_URI`               | MongoDB connection string            | —                   |
| `MONGODB_DATABASE`          | Database name                        | ai_voice_agent      |
| `JWT_SECRET_KEY`            | JWT signing secret                   | *(change-me)*       |
| `JWT_ALGORITHM`             | JWT algorithm                        | HS256               |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration (minutes)         | 60                  |
| `OPENAI_API_KEY`            | OpenAI API key (if using OpenAI)     | —                   |
| `STT_PROVIDER`              | STT engine                           | faster-whisper      |
| `WHISPER_MODEL`             | Whisper model size                   | small               |
| `WHISPER_DEVICE`            | Inference device                     | cpu                 |
| `WHISPER_COMPUTE_TYPE`      | Compute precision                    | int8                |
| `TTS_PROVIDER`              | TTS engine                           | elevenlabs          |
| `ELEVENLABS_API_KEY`        | ElevenLabs API key                   | —                   |
| `ELEVENLABS_VOICE_ID`       | ElevenLabs voice ID                  | —                   |
| `CHROMA_HOST`               | ChromaDB host                        | localhost           |
| `CHROMA_PORT`               | ChromaDB port                        | 8000                |

### 4. Start infrastructure services

```bash
docker-compose up -d mongodb chromadb
```

### 5. Run the development server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 🐳 Running with Docker (Full Stack)

```bash
docker-compose up --build
```

## 📡 API Documentation

Once running, interactive docs are available at:

| Docs      | URL                             |
| --------- | ------------------------------- |
| Swagger   | http://localhost:8000/docs      |
| ReDoc     | http://localhost:8000/redoc     |

## 🔌 WebSocket Protocol

**Endpoint:** `ws://localhost:8000/api/voice/ws?token=<JWT>&conversation_id=<ID>`

### Client → Server

| Message Type   | Payload                                |
| -------------- | -------------------------------------- |
| `audio_chunk`  | `{"type": "audio_chunk", "data": "<base64_pcm>"}` |
| `stop_audio`   | `{"type": "stop_audio"}`               |

### Server → Client

| Message Type        | Payload                                           |
| ------------------- | ------------------------------------------------- |
| `transcript`        | `{"type": "transcript", "text": "..."}`           |
| `thinking`          | `{"type": "thinking"}`                             |
| `response_text`     | `{"type": "response_text", "text": "..."}`        |
| `speaking_started`  | `{"type": "speaking_started"}`                     |
| `audio_chunk`       | `{"type": "audio_chunk", "data": "<base64_wav>"}` |
| `speaking_finished` | `{"type": "speaking_finished"}`                    |
| `error`             | `{"type": "error", "message": "..."}`             |

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/              # Route handlers (REST + WebSocket)
│   ├── core/             # Logging, middleware, shared core logic
│   ├── database/         # MongoDB connection & helpers
│   ├── models/           # Pydantic ODM models
│   ├── schemas/          # Request/response Pydantic schemas
│   ├── services/         # Business logic layer
│   │   ├── agent/        # LangGraph agent & orchestration
│   │   ├── voice/        # STT, TTS, VAD services
│   │   ├── tools/        # Agent tool definitions
│   │   └── auth_service.py
│   ├── utils/            # Utility functions
│   ├── config.py         # Settings (pydantic-settings)
│   └── main.py           # FastAPI app entrypoint
├── tests/                # Pytest test suite
├── uploads/              # User-uploaded files (gitignored)
├── requirements.txt      # Python dependencies
├── Dockerfile            # Container image definition
├── docker-compose.yml    # Multi-service orchestration
└── .env.example          # Template environment variables
```

## 🧩 Extending the Agent

### Adding a new tool

1. Create a new file in `app/services/tools/`
2. Define a function decorated with `@tool` from `langchain_core.tools`
3. Import and register it in `app/services/tools/registry.py`

## 🔧 External Services Setup

### Ollama (Local LLM)

1. Install [Ollama](https://ollama.com/)
2. Pull a model: `ollama run qwen2.5:7b`
3. Set `LLM_PROVIDER=ollama` and `OLLAMA_BASE_URL=http://localhost:11434` in `.env`

### Whisper (Local STT)

`faster-whisper` downloads model weights automatically on first run. Adjust `WHISPER_MODEL` in `.env` to control size (`tiny`, `base`, `small`, `medium`, `large-v3`).

### ElevenLabs (TTS)

1. Get an API key from [ElevenLabs](https://elevenlabs.io/)
2. Set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` in `.env`

## ❓ Troubleshooting

| Issue                          | Solution                                              |
| ------------------------------ | ----------------------------------------------------- |
| Audio processing errors        | Ensure `ffmpeg` is installed on your system           |
| WebSocket disconnects (1008)   | Verify JWT token is valid and passed in query string  |
| Whisper/Silero memory issues   | Reduce `WHISPER_MODEL` to `tiny` in `.env`            |
| ChromaDB connection refused    | Run `docker-compose up -d chromadb`                   |
| MongoDB auth failures          | Check `MONGODB_URI` credentials in `.env`             |

## 🔗 Related

- [Frontend README](../frontend/README.md) — Next.js client, UI components, and setup
