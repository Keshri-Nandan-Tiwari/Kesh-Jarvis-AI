# Deploying Kesh — Full Combined Guide

Everything free: **Render** (backend hosting), **Vercel** (frontend hosting),
**Neon** (Postgres database). This is the same stack pattern you already used
for your portfolio project.

This is the streamlined path. For troubleshooting or more detail on any step,
see `kesh-backend/DEPLOY.md` and `kesh-frontend/DEPLOY.md` — this file is the
map, those are the zoomed-in versions.

---

## 0. Push to GitHub first

Render and Vercel both deploy from a Git repo, not a zip upload. Push this
entire `kesh/` folder as one repo (simplest — both services will just point
at different subfolders of the same repo):

```bash
cd kesh
git init
git add .
git commit -m "Kesh — initial deploy-ready commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kesh.git
git push -u origin main
```

---

## 1. Database — Neon Postgres

1. https://console.neon.tech → New Project (free tier) — reuse your existing
   Neon account from the portfolio project if you like
2. Create a database named `kesh_db`
3. Copy the connection string Neon shows you, then convert it to JDBC format:
   ```
   Neon gives you:  postgresql://user:pass@ep-xxx.neon.tech/kesh_db?sslmode=require
   You need:        jdbc:postgresql://ep-xxx.neon.tech/kesh_db?sslmode=require
   ```
   (Just add `jdbc:` at the front. Keep username/password separate for step 2.)

---

## 2. Backend — Render

1. https://dashboard.render.com → New → Blueprint
2. Connect your GitHub repo — Render finds `render.yaml` at the repo root
   automatically. It already specifies `rootDir: kesh-backend`, so Render
   knows to build from that subfolder without you configuring anything extra
3. Fill in environment variables when prompted:

   | Key | Value |
   |---|---|
   | `SPRING_DATASOURCE_URL` | Your Neon JDBC URL from step 1 |
   | `SPRING_DATASOURCE_USERNAME` | Neon username |
   | `SPRING_DATASOURCE_PASSWORD` | Neon password |
   | `JWT_SECRET` | Output of `openssl rand -base64 32` |
   | `CORS_ALLOWED_ORIGINS` | Leave blank for now — come back after step 3 |
   | `GROQ_API_KEY` | **Required** — deployed Kesh has no offline brain, needs this to answer anything. Free key: https://console.groq.com/keys |
   | `GEMINI_API_KEY` | Optional fallback — https://aistudio.google.com/apikey |
   | `OPENWEATHER_API_KEY` | Optional, for weather — https://home.openweathermap.org/api_keys |
   | `NEWSAPI_API_KEY` | Optional, for news — https://newsapi.org/register |

4. Deploy. Note your backend URL once it's live, e.g.
   `https://kesh-backend-xxxx.onrender.com`
5. Verify: `curl https://kesh-backend-xxxx.onrender.com/api/health`
   should return `Kesh backend is alive.`

**Free tier note:** spins down after 15 min idle, takes ~30-60s to wake on
the next request. Normal behavior, not a bug.

---

## 3. Frontend — Vercel

1. https://vercel.com/new → Import the same GitHub repo
2. **Set the root directory to `kesh-frontend`** (same multi-project
   situation as Render above — Vercel asks for this during import)
3. Framework preset: Vite (auto-detected)
4. Environment variable:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | Your Render backend URL + `/api`, e.g. `https://kesh-backend-xxxx.onrender.com/api` |

5. Deploy. Note your frontend URL, e.g. `https://kesh-frontend-xxxx.vercel.app`

---

## 4. Connect them — fix CORS

Go back to Render → your backend service → Environment → set:
```
CORS_ALLOWED_ORIGINS=https://kesh-frontend-xxxx.vercel.app
```
(Your actual Vercel URL.) Save — Render redeploys automatically.

---

## 5. Test the whole thing

Visit your Vercel URL. You should land on the Kesh login screen. Sign up,
log in, chat, try voice (works over HTTPS automatically — no extra config),
try the orb, try the settings panel.

---

## Troubleshooting quick reference

| Symptom | Likely cause |
|---|---|
| Frontend loads but chat does nothing | `VITE_API_URL` missing/wrong, or CORS not set yet |
| "Backend unreachable" forever | Render service still waking up (free tier) — wait ~60s and retry |
| 401 immediately after signing up | `JWT_SECRET` missing or under 32 characters on Render |
| CORS error in browser console | `CORS_ALLOWED_ORIGINS` doesn't exactly match your Vercel URL (check for trailing slash mismatches) |
| Kesh gives generic/wrong answers | No `GROQ_API_KEY` set — deployed Kesh has no offline fallback |
| Database connection errors | JDBC URL missing the `jdbc:` prefix, or `sslmode=require` dropped from the Neon connection string |

If you hit something not listed here, paste the exact error back and it'll
get fixed same-message rather than guessed at.
