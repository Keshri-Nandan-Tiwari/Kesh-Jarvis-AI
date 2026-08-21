# Deploying Kesh Backend to Render (free tier)

> **If you have the combined `kesh/` monorepo, use the root-level
> `DEPLOY.md` instead — it covers backend + frontend + database together
> and already accounts for the monorepo folder structure.** This file is
> kept for reference if you ever split this backend into its own standalone
> repo.

You've done this exact pattern before with your portfolio backend (Render +
Neon Postgres) — this follows the same shape.

## Before you deploy — one important reality check

**The offline Ollama brain will not work once deployed.** Render's servers
don't run Ollama, so there's no local model to talk to. The router now
auto-falls-back to cloud (Groq/Gemini) whenever Ollama is unreachable, so
Kesh will still work — it just means your deployed Kesh always uses the free
cloud brain, not the offline one. The offline brain remains fully useful when
you run the backend on your own PC (Stage 1's original setup) — this is a
tradeoff specific to hosting on someone else's server, not a bug.

**Practically:** make sure you have a Groq or Gemini API key configured in
Render (see below), or deployed Kesh won't be able to answer anything.

## Step 1 — Push this to GitHub
Render deploys from a Git repo, not a zip upload directly.
```bash
cd kesh-backend
git init
git add .
git commit -m "Kesh backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kesh-backend.git
git push -u origin main
```
(`.gitignore` already excludes `.env` — never commit real secrets.)

## Step 2 — Set up your Neon database
You already have a Neon project from your portfolio work. Either reuse it
with a new database, or create a fresh Neon project:
1. https://console.neon.tech → New Project (free tier)
2. Create a database named `kesh_db`
3. Copy the connection string Neon gives you — it looks like:
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/kesh_db?sslmode=require
   ```
4. **Convert it to JDBC format** (Spring Boot needs the `jdbc:` prefix):
   ```
   jdbc:postgresql://ep-xxx.region.aws.neon.tech/kesh_db?sslmode=require
   ```
   Keep the username/password separate — you'll set them as their own env vars.

## Step 3 — Create the Render service
**Option A — Blueprint (faster, only works if this folder is its own repo):**
1. https://dashboard.render.com → New → Blueprint
2. Connect your `kesh-backend` GitHub repo — Render reads `render.yaml`
   automatically (note: the monorepo version of this file lives at the
   `kesh/` root, not here — see the pointer note at the top of this file)
3. Fill in the env vars it prompts for (see Step 4)

**Option B — Manual:**
1. https://dashboard.render.com → New → Web Service
2. Connect your repo, select "Docker" as the runtime (it'll find the `Dockerfile`)
3. Choose the Free plan

## Step 4 — Set environment variables
In the Render dashboard → your service → Environment, add:

| Key | Value |
|---|---|
| `SPRING_DATASOURCE_URL` | Your Neon JDBC URL from Step 2 |
| `SPRING_DATASOURCE_USERNAME` | Your Neon username |
| `SPRING_DATASOURCE_PASSWORD` | Your Neon password |
| `JWT_SECRET` | Output of `openssl rand -base64 32` |
| `CORS_ALLOWED_ORIGINS` | Your Vercel frontend URL (set this after Step 5 below, or come back and update it) |
| `GROQ_API_KEY` | Your free Groq key — **do this, deployed Kesh needs it** |
| `GEMINI_API_KEY` | Optional fallback |
| `OPENWEATHER_API_KEY` | Optional, for weather |
| `NEWSAPI_API_KEY` | Optional, for news |

Render auto-assigns `PORT` — you don't need to set it, `application.yml`
already reads it.

## Step 5 — Deploy and verify
Render builds and deploys automatically after you save the env vars. Once
live, test it:
```bash
curl https://kesh-backend-XXXX.onrender.com/api/health
```
Should return `Kesh backend is alive.`

**Free tier note:** Render's free web services spin down after 15 minutes of
inactivity and take ~30-60 seconds to wake back up on the next request. This
is normal, not a bug — the first message after idle time will just be slow.

## Step 6 — Come back and fix CORS
Once your frontend is deployed (see the frontend's own deploy guide) and you
have its real URL, update `CORS_ALLOWED_ORIGINS` in Render with that exact
URL, or the frontend won't be able to call this backend at all.
