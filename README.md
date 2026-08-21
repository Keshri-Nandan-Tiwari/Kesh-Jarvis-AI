# Kesh — Personal AI Assistant

A JARVIS-inspired personal AI assistant. Hybrid brain (offline Ollama +
free cloud Groq/Gemini), full voice interaction with barge-in, a full-screen
animated particle orb, multi-language support, themes, real-time weather/news,
wake word, and real authentication. Built entirely on free tools.

## Structure

```
kesh/
├── kesh-backend/    Spring Boot API — the brain, auth, chat storage
├── kesh-frontend/   React web app — chat UI, voice, the orb, settings
└── kesh-desktop/    Tauri wrapper — packages kesh-frontend as a native app
```

Each subfolder has its own `README.md` (what it does, how to run it locally)
and `DEPLOY.md` (how to put it on the internet for free). **This file is the
map — start here, then dive into whichever guide you need.**

## Quick start (local development)

```bash
# 1. Backend
cd kesh-backend
cp .env.example .env          # fill in at least JWT_SECRET
# install Ollama + pull a model, create kesh_db in Postgres — see kesh-backend/README.md
mvn spring-boot:run

# 2. Frontend (separate terminal)
cd kesh-frontend
npm install
npm run dev
# open http://localhost:5173
```

Full step-by-step setup (Ollama install, Postgres, free API keys) is in
`kesh-backend/README.md`. Voice/orb/language/theme details are in
`kesh-frontend/README.md`.

## Deploying for free

See **[DEPLOY.md](./DEPLOY.md)** in this folder for the full combined
walkthrough (Render for backend, Vercel for frontend, Neon for database —
all free tiers). The short version:

1. Push this whole repo to GitHub
2. Deploy `kesh-backend/` to Render (Docker-based, `render.yaml` included)
3. Deploy `kesh-frontend/` to Vercel
4. Point them at each other via two environment variables
5. Done — `https://your-app.vercel.app` is live

## Known tradeoff when deployed

The offline Ollama brain only works when you run the backend on your own
machine — a hosting service like Render doesn't run Ollama for you. Deployed
Kesh automatically falls back to the free cloud brain (Groq/Gemini) instead.
Locally, you still get the full free-forever offline+cloud hybrid.

## What's built so far

- **Brain**: hybrid offline/cloud routing, weather + news real-time context
- **Auth**: signup/login, JWT, per-account private chat history
- **Voice**: push-to-talk, hands-free, wake word ("Hey Kesh"), barge-in interruption
- **Orb**: full-screen animated Three.js particle sphere reacting to voice/state
- **Personalization**: 4 themes, 10 languages, voice/accent picker
- **Desktop**: Tauri wrapper for a native app experience

## Not built yet
- Password reset flow
- Email verification on signup
- Backend doesn't auto-start as part of the desktop app (runs separately)
