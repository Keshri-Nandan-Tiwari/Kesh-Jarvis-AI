# Deploying Kesh Frontend to Vercel (free tier)

> **If you have the combined `kesh/` monorepo, use the root-level
> `DEPLOY.md` instead.** This file is kept for reference if you ever split
> this frontend into its own standalone repo.

## Step 1 — Push this to GitHub
```bash
cd kesh-frontend
git init
git add .
git commit -m "Kesh frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kesh-frontend.git
git push -u origin main
```

## Step 2 — Import into Vercel
1. https://vercel.com/new → Import your `kesh-frontend` repo
2. Vercel auto-detects Vite — framework preset should already say "Vite"
3. Build command: `npm run build` (default, no change needed)
4. Output directory: `dist` (default, no change needed)

## Step 3 — Set the environment variable
Before deploying, add this in Vercel's "Environment Variables" section:

| Key | Value |
|---|---|
| `VITE_API_URL` | Your deployed Render backend URL + `/api`, e.g. `https://kesh-backend-xxxx.onrender.com/api` |

This is required — without it, the deployed frontend will try to call
`localhost:8080`, which doesn't exist on the internet.

## Step 4 — Deploy
Click Deploy. Vercel gives you a URL like `https://kesh-frontend-xxxx.vercel.app`.

## Step 5 — Fix CORS on the backend
Go back to your Render backend's environment variables and set:
```
CORS_ALLOWED_ORIGINS=https://kesh-frontend-xxxx.vercel.app
```
(Use your actual Vercel URL.) Redeploy the backend for this to take effect —
Render usually does this automatically when you save env var changes.

## Step 6 — Test the whole thing
Visit your Vercel URL, sign up for an account, and try chatting with Kesh.

## Voice on a deployed site — one extra requirement
Browsers only allow microphone access on secure origins. Vercel serves
everything over HTTPS by default, so voice input/output, the orb reacting to
your voice, wake word, all of it should work exactly like it did locally —
no extra config needed. (This would NOT work if you self-hosted over plain
HTTP somewhere — worth knowing if you ever move off Vercel.)

## Known limitations of the deployed version
- Deployed Kesh always uses the cloud brain (Groq/Gemini) — see the
  backend's `DEPLOY.md` for why the offline Ollama brain doesn't apply here
- Free-tier Render backend sleeps after 15 min idle — first message after a
  gap will be slow (30-60s) while it wakes up
- The Tauri desktop app (`kesh-desktop`) is a separate distribution path —
  it still expects a `kesh-backend` reachable at `localhost:8080` by
  default. To point your desktop app at the deployed backend instead of a
  locally-running one, set `VITE_API_URL` in `kesh-frontend/.env` before
  running `npm run tauri build`.
