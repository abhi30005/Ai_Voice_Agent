<div align="center">

# 🎙️ AI Voice Agent

**A full-stack, real-time AI voice assistant powered by LLMs, speech recognition, and text-to-speech.**

Talk to an intelligent agent that listens, thinks, and speaks back — with tool calling, RAG, and conversation memory.

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js_15-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 🧠 What is this?

AI Voice Agent is an end-to-end voice-powered AI assistant. You speak into the microphone, the system transcribes your speech in real-time, routes it through an intelligent LLM agent (with tools and memory), and speaks the response back to you — all over WebSockets with sub-second latency.

### 🔊 Voice Pipeline

```
🎤 Mic Input → Silero VAD → faster-whisper (STT) → LangGraph Agent → LLM → ElevenLabs (TTS) → 🔈 Speaker
```

---

## ✨ Features

### 🗣️ Voice
- **Real-time WebSocket streaming** — Bidirectional audio over a single connection
- **Voice Activity Detection** — Silero VAD detects when you start/stop speaking
- **Speech-to-Text** — Local transcription via faster-whisper (multiple model sizes)
- **Text-to-Speech** — ElevenLabs, gTTS, or extensible provider interface

### 🤖 Agent
- **LangGraph-powered agent** — Stateful, multi-step reasoning with tool calling
- **Multi-LLM support** — OpenAI, Groq, and Ollama (fully local)
- **Built-in tools** — Calculator, date/time, web search, and custom tools
- **RAG pipeline** — Upload documents, chunk, embed, and retrieve with ChromaDB

### 💬 Conversations
- **Persistent memory** — Full conversation history stored in MongoDB
- **Multi-conversation** — Create, switch, and resume past conversations
- **JWT authentication** — Secure user sessions and WebSocket connections

### 🎨 Frontend
- **Modern UI** — Dark glassmorphism design with smooth Motion animations
- **Live transcription** — See your words appear as you speak
- **Responsive** — Works on desktop and mobile

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 15)                    │
│  React 19 · TypeScript · Tailwind CSS 4 · Motion · Lucide      │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ Voice Hub│  │ Sidebar  │  │ Live View │  │ Context Panel│  │
│  └────┬─────┘  └──────────┘  └───────────┘  └──────────────┘  │
│       │ WebSocket (audio + events)                              │
└───────┼─────────────────────────────────────────────────────────┘
        │
┌───────┼─────────────────────────────────────────────────────────┐
│       ▼         BACKEND (FastAPI + Uvicorn)                     │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ Silero   │  │ faster-  │  │ LangGraph │  │ ElevenLabs / │  │
│  │ VAD      │→ │ whisper  │→ │ Agent     │→ │ gTTS         │  │
│  └──────────┘  └──────────┘  └─────┬─────┘  └──────────────┘  │
│                                    │                            │
│                    ┌───────────────┼───────────────┐           │
│                    ▼               ▼               ▼           │
│              ┌──────────┐  ┌───────────┐  ┌──────────────┐    │
│              │ Tools    │  │ RAG       │  │ LLM Provider │    │
│              │ Registry │  │ (ChromaDB)│  │ (OpenAI/Groq │    │
│              └──────────┘  └───────────┘  │  /Ollama)    │    │
│                                           └──────────────┘    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   MongoDB (Motor async)                   │  │
│  │            Users · Conversations · Messages               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer            | Technology                                      |
| ---------------- | ----------------------------------------------- |
| **Frontend**     | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| **Backend**      | FastAPI, Uvicorn, Python 3.12+                  |
| **Agent**        | LangGraph, LangChain                            |
| **LLM**          | OpenAI, Groq, Ollama (local)                    |
| **Speech-to-Text** | faster-whisper (CTranslate2)                  |
| **Text-to-Speech** | ElevenLabs, gTTS                              |
| **VAD**          | Silero VAD                                      |
| **Database**     | MongoDB (Motor async driver)                    |
| **Vector Store** | ChromaDB + sentence-transformers                |
| **Auth**         | JWT (python-jose + passlib)                     |
| **DevOps**       | Docker, Docker Compose                          |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- **Python** 3.12+
- **ffmpeg** installed on your system
- **Docker** (for MongoDB & ChromaDB)

### 1. Clone the repository

```bash
git clone https://github.com/abhi30005/Ai_Voice_Agent.git
cd Ai_Voice_Agent
```

### 2. Start infrastructure

```bash
cd backend
docker-compose up -d mongodb chromadb
```

### 3. Backend setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys (OpenAI, ElevenLabs, MongoDB URI)

# Run the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your keys

# Run the dev server
npm run dev
```

### 5. Open the app

Visit [http://localhost:3000](http://localhost:3000) and start talking! 🎤

---

## 📁 Project Structure

```
Ai_Voice_Agent/
├── backend/                    # FastAPI server
│   ├── app/
│   │   ├── api/                # REST & WebSocket route handlers
│   │   ├── core/               # Logging, security, middleware
│   │   ├── database/           # MongoDB connection & indexes
│   │   ├── models/             # Pydantic ODM models
│   │   ├── schemas/            # Request/response schemas
│   │   ├── services/
│   │   │   ├── agent/          # LangGraph agent & orchestration
│   │   │   ├── llm/            # LLM provider abstraction
│   │   │   ├── rag/            # Document loading, chunking, retrieval
│   │   │   ├── tools/          # Agent tool definitions
│   │   │   └── voice/          # STT, TTS, VAD services
│   │   ├── utils/              # Helpers (audio, file, validators)
│   │   ├── config.py           # App settings (pydantic-settings)
│   │   └── main.py             # FastAPI entrypoint
│   ├── tests/                  # Pytest test suite
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── requirements.txt
│
├── frontend/                   # Next.js client
│   ├── app/                    # App Router pages & layouts
│   ├── components/             # React UI components
│   ├── hooks/                  # Custom hooks (voice socket, mobile)
│   ├── lib/                    # Utilities
│   ├── assets/                 # Static assets
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── package.json
│
└── README.md                   # ← You are here
```

---

## 🔌 API Endpoints

| Method     | Endpoint                        | Description                  |
| ---------- | ------------------------------- | ---------------------------- |
| `POST`     | `/api/auth/register`            | Register a new user          |
| `POST`     | `/api/auth/login`               | Login and get JWT token      |
| `GET`      | `/api/conversations`            | List user conversations      |
| `POST`     | `/api/conversations`            | Create a new conversation    |
| `POST`     | `/api/documents/upload`         | Upload document for RAG      |
| `POST`     | `/api/agent/chat`               | Send a text message to agent |
| `WebSocket`| `/api/voice/ws`                 | Real-time voice streaming    |
| `GET`      | `/api/health`                   | Health check                 |

📖 Full interactive docs at [localhost:8000/docs](http://localhost:8000/docs) (Swagger) and [localhost:8000/redoc](http://localhost:8000/redoc) (ReDoc).

---

## 🧩 Extending the Agent

### Add a new tool

1. Create a file in `backend/app/services/tools/`:

```python
from langchain_core.tools import tool

@tool
def my_custom_tool(query: str) -> str:
    """Description of what this tool does."""
    return f"Result for: {query}"
```

2. Register it in `backend/app/services/tools/registry.py`

### Add a new LLM provider

1. Create a provider in `backend/app/services/llm/`
2. Implement the base interface from `backend/app/services/llm/base.py`
3. Wire it up in the agent configuration

---

## 🐳 Docker Deployment

Run the entire stack with a single command:

```bash
cd backend
docker-compose up --build
```

This starts:
- **FastAPI** backend on port `8000`
- **MongoDB** on port `27017`
- **ChromaDB** on port `8000`

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ by [Abhijit](https://github.com/abhi30005)**

</div>
