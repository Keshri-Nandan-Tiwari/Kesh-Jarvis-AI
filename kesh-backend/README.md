# Kesh Backend — Stage 1 (The Brain)

This is a working Spring Boot backend with a `/api/chat` endpoint that:
- Talks to a **local Ollama model** (free, offline, unlimited)
- Falls back to **Groq or Gemini** (free cloud tiers) when online and needed
- Saves every conversation to **PostgreSQL**

No UI yet — you'll test this with Postman/curl first. UI comes in Stage 2.

---

## Step 1 — Install PostgreSQL (if you don't have it already)
You already use Postgres for your portfolio project, so likely already set up.
Just create a fresh database:
```sql
CREATE DATABASE kesh_db;
```

## Step 2 — Install Ollama (the offline brain)
1. Download from https://ollama.com/download (Windows/Mac/Linux, free)
2. After install, open a terminal and pull a model:
   ```
   ollama pull llama3.1:8b
   ```
   - If your PC has less RAM (8GB or less), use a smaller model instead:
     ```
     ollama pull mistral:7b
     ```
     and change `kesh.ollama.model` in `application.yml` to match.
3. Ollama runs automatically as a background service after install
   (or run `ollama serve` manually). It listens on `http://localhost:11434`.
4. Test it works:
   ```
   ollama run llama3.1:8b "Say hello in one sentence"
   ```

## Step 3 — Get free cloud API keys (optional but recommended)
- **Groq** (fast, free, recommended primary cloud brain):
  https://console.groq.com/keys → Sign up free → Create API Key
- **Gemini** (fallback):
  https://aistudio.google.com/apikey → Sign in with Google → Create API Key

Copy `.env.example` to `.env` and paste your keys in:
```
cp .env.example .env
```
Then edit `.env` and fill in `GROQ_API_KEY` and/or `GEMINI_API_KEY`.

> Note: Spring Boot doesn't read `.env` files natively — this project includes
> `spring-dotenv` in the pom.xml specifically so it does. Just having the
> `.env` file in the project root is enough; no extra setup needed.

## Step 4 — Run the backend
```
cd kesh-backend
mvn spring-boot:run
```
You should see:
```
KESH backend is online.
Try: POST http://localhost:8080/api/chat
```

## Step 5 — Test it
**Health check:**
```
curl http://localhost:8080/api/health
```

**Chat (offline brain, routine question):**
```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the capital of Japan?", "mode": "auto"}'
```

**Chat (forces cloud, needs real-time data):**
```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the latest news today?", "mode": "auto"}'
```
This should auto-route to cloud because "latest" and "today" are real-time keywords.

**Continue the same conversation** (pass the `sessionId` you got back):
```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me more about that.", "sessionId": 1}'
```

**View chat history:**
```
curl http://localhost:8080/api/chat/1/history
```

---

## How the routing works (`BrainRouterService`)
- No internet → always offline (Ollama)
- Online + message contains words like "today", "latest", "news", "weather", "current" → cloud
- Online + routine question → offline by default (free, private, no rate limits)
- You can force either brain per-request with `"mode": "offline"` or `"mode": "cloud"`

You'll tune these rules as you use it more — this is a sensible starting point, not final.

---

## What's NOT in Stage 1 (comes later)
- No frontend/UI yet (Stage 2)
- No voice (Stage 3)
- No auth/login yet — all chats currently save under a placeholder "keshri" owner (Stage 2 adds real JWT auth, reusing your portfolio's auth code)

---

## Stage 6 update — Real-time data (weather & news)

The router now actually fetches live data for weather/news questions and hands
it to the cloud model as context, instead of letting the LLM guess from stale
training knowledge.

### Setup
Get two more free keys and add them to `.env`:
- **OpenWeatherMap**: https://home.openweathermap.org/api_keys (free tier: 1,000 calls/day)
- **NewsAPI**: https://newsapi.org/register (free tier: developer/testing use)

```
OPENWEATHER_API_KEY=your_key_here
NEWSAPI_API_KEY=your_key_here
```

### Try it
```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the weather in Jabalpur?", "mode": "auto"}'
```
This should route to cloud, fetch live Jabalpur weather, and answer with the
actual current conditions rather than a generic non-answer.

```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the latest news today?", "mode": "auto"}'
```

### Notes
- Weather needs a city name in the message (e.g. "weather in Delhi"). If none
  is given, Kesh is told to ask you which city instead of guessing.
- News currently always returns top US headlines (NewsAPI's free-tier
  `top-headlines` endpoint) — regional/topic filtering would need a paid tier
  or switching to a different free news source later.
- Only triggers when the router picks the cloud brain (i.e. you're online) —
  offline mode has no way to fetch live data either way.

---

## Troubleshooting
| Problem | Fix |
|---|---|
| `Offline brain error: Connection refused` | Ollama isn't running. Run `ollama serve` in a terminal. |
| Offline replies are slow | Normal on CPU-only machines. Try `mistral:7b` (smaller/faster) instead of `llama3.1:8b`. |
| `No cloud API key configured` | You didn't fill in `.env`. Cloud mode isn't required — offline still works fine. |
| Postgres connection error | Check `kesh_db` exists and username/password in `.env` match your local Postgres setup. |

---

**Next up: Stage 2 — basic React chat UI wired to this backend.**

---

## Stage 7 update — Authentication

Real signup/login now, via Spring Security + JWT. Every chat is tied to the
account that created it — no more shared placeholder user.

### Setup
1. Generate a JWT secret and add it to `.env`:
   ```
   openssl rand -base64 32
   ```
   Paste the output as `JWT_SECRET=...` in `.env`. The app will refuse to
   start with a clear error if this is missing or too short — better than a
   cryptic crypto error on your first login attempt.

2. **Important — schema change**: adding real users changes how chat
   ownership works. If you've been running earlier stages already, drop and
   recreate your dev database to avoid leftover data mismatches:
   ```sql
   DROP DATABASE kesh_db;
   CREATE DATABASE kesh_db;
   ```

### Try it
```bash
# Sign up
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"keshri","email":"you@example.com","password":"a-real-password"}'
# Returns { token, username, email } — save the token

# Use it on a protected endpoint
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <paste token here>" \
  -d '{"message": "Hello Kesh"}'
```
Calling `/api/chat` or `/api/sessions` without a valid token now correctly
returns 401/403 — this is expected, not a bug.

### What changed under the hood
- New `User` entity + `/api/auth/signup` and `/api/auth/login` endpoints
- Every other `/api/**` endpoint now requires a valid JWT (except `/api/health`)
- Chat sessions are tied to the real logged-in user; the history/session
  endpoints verify ownership so one user can't read another's chats by
  guessing a session ID
- Removed the old CORS config class — Spring Security now owns CORS handling
  directly (required for auth headers + preflight requests to work together)
