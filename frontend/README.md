# 🎙️ AI Voice Agent — Frontend

The frontend for the AI Voice Agent, built with **Next.js 15**, **React 19**, **TypeScript**, and **Tailwind CSS 4**. It provides a real-time conversational UI that streams audio to the backend over WebSockets and plays back synthesized speech.

## ✨ Features

- **Real-time voice chat** — Push-to-talk and continuous listening modes via WebSocket streaming
- **Live transcription** — See your speech transcribed in real-time as you speak
- **Animated responses** — Smooth typing animations for agent replies
- **Conversation history** — Browse and resume past conversations
- **Dark mode UI** — Premium glassmorphism design with motion animations
- **Responsive layout** — Works across desktop and mobile devices

## 🛠️ Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Framework    | Next.js 15 (App Router)            |
| Language     | TypeScript 5.9                      |
| UI Library   | React 19                            |
| Styling      | Tailwind CSS 4, CVA, tailwind-merge |
| Animations   | Motion (Framer Motion)              |
| Icons        | Lucide React                        |
| AI SDK       | Google GenAI SDK                    |

## 📋 Prerequisites

- **Node.js** 18+ (recommended: 20 LTS)
- **npm** 9+ (comes with Node.js)
- Backend server running (see `../backend/README.md`)

## 🚀 Getting Started

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

Copy the example env file and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable         | Description                            |
| ---------------- | -------------------------------------- |
| `GEMINI_API_KEY` | Your Google Gemini API key             |
| `APP_URL`        | The URL where the frontend is hosted   |

### 3. Start the dev server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## 📦 Available Scripts

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start development server          |
| `npm run build` | Create optimized production build |
| `npm run start` | Serve the production build        |
| `npm run lint`  | Run ESLint across the codebase    |
| `npm run clean` | Clear Next.js cache               |

## 📁 Project Structure

```
frontend/
├── app/                  # Next.js App Router pages & layouts
│   ├── layout.tsx        # Root layout with metadata & fonts
│   ├── page.tsx          # Main landing / chat page
│   └── globals.css       # Global styles & Tailwind imports
├── components/           # Reusable React components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions & shared logic
├── assets/               # Static assets (images, icons)
├── next.config.ts        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
├── postcss.config.mjs    # PostCSS / Tailwind config
└── package.json          # Dependencies & scripts
```

## 🔗 Related

- [Backend README](../backend/README.md) — FastAPI server, WebSocket API, and AI agent docs
