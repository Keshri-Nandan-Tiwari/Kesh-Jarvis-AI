# Kesh Frontend — Stage 2 (Basic Chat UI)

A dark, amber-themed chat interface wired to your Stage 1 Spring Boot backend.
No voice yet, no orb yet — that's Stage 3 and 4. This just proves the full
loop works: type a message → backend picks offline/cloud brain → reply shows up,
tagged with which brain answered.

---

## Prerequisites
- Node.js 18+ installed (https://nodejs.org — free, LTS version)
- Your Stage 1 backend already running on `http://localhost:8080`
  (`cd kesh-backend && mvn spring-boot:run`)

## Setup
```bash
cd kesh-frontend
npm install
npm run dev
```
Open the URL it prints (usually `http://localhost:5173`).

## What you should see
- Dark background, amber "Kesh" logo top-left with a pulsing dot
- Empty state: "Hey, I'm Kesh."
- Type a message, hit Send (or Enter)
- Your message appears as an amber bubble on the right
- Kesh's reply appears on the left, with a small tag showing
  ⚡ offline (Ollama) or ☁ cloud (Groq/Gemini) depending on which brain answered
- Sidebar fills in with past conversations as you chat — click any to reload that history
- Bottom-left status dot: green = backend reachable, red = not

## Troubleshooting
| Problem | Fix |
|---|---|
| "Backend unreachable" / red dot | Make sure Stage 1 backend is running on port 8080 first |
| CORS error in browser console | Confirm `CorsConfig.java` in the backend allows `http://localhost:5173` (it does by default) |
| Blank white screen | Check the browser console for errors, and confirm `npm install` finished without errors |
| `npm install` fails | Check your internet connection — this step needs it once, to download packages |

## Known limitations at this stage
- No login/auth yet — everything is a single shared user (`keshri`) on the backend for now
- No JARVIS orb animation yet — plain chat bubbles for now (Stage 4)
- Refreshing the page loses your place in the current chat (session list still works, just re-click it)

---

## Stage 3 update — Voice

Voice runs on the browser's built-in Speech Recognition (listening) and
Speech Synthesis (talking) APIs. Zero installs, zero cost, works today.

### How to use it
- **🎙 button (push-to-talk)**: click once, speak your question, it auto-sends when you pause and stops listening
- **Hands-free toggle**: click "Hands-free: OFF" to turn it on — Kesh now listens continuously. Say something anytime, even while she's talking, and she'll stop instantly and listen to you (barge-in/interruption)
- **Voice dropdown**: pick from whatever voices your OS/browser has installed — this is your accent/voice changer for now (System Preferences → Accessibility → Spoken Content on Mac, or Windows Settings → Speech, lets you install more)

### Important caveats
- **Browser support**: Chrome and Edge have full support. Safari is partial. Firefox doesn't support speech recognition natively — you'll see an "unsupported" message and can still type normally.
- **Internet requirement for listening**: Chrome's recognition engine calls Google's servers in the background — so voice *input* needs internet even though the chat brain itself can run fully offline. Voice *output* (Kesh talking) works 100% offline.
- **Feedback in hands-free mode**: if you're on speakers (not headphones) in hands-free mode, the mic can occasionally pick up Kesh's own voice and think you're interrupting. Headphones eliminate this. Push-to-talk mode has no such issue since the mic isn't listening while she talks.
- A true offline speech-to-text swap (Whisper.cpp/Vosk) is possible later without changing anything else — it would just replace what's inside `useVoiceAssistant.js`.

---

**Next up: the Tauri desktop wrapper — see the separate `kesh-desktop` package.**

---

## Stage 6 update — Wake word + fixes

### Fixed from Stage 5
- Settings (⚙) is now reachable from full-screen orb mode too, not just chat view
- Mobile now has a hamburger button (☰, top-left) to reopen the sidebar once it auto-hides

### Wake word ("Hey Kesh")
Turn it on in Settings → Wake Word. Once enabled, Kesh passively listens in
the background — say "Hey Kesh" (or "Hey Cash", "Hi Kesh", "OK Kesh" — common
mishears are included) and she wakes up to take your command. You can say the
command in the same breath ("Hey Kesh, what's the weather in Jabalpur") or
pause after the wake phrase and she'll wait up to 6 seconds for your question.

**This is a browser-native approximation, not a true dedicated wake-word
engine** (like Porcupine or openWakeWord, which run a tiny always-on model
fully offline). Because it's built on the same Speech Recognition API as
everything else here, it needs internet running continuously in the
background while enabled — a real tradeoff worth knowing about, versus the
zero-internet-footprint of a purpose-built wake-word engine.

**Known edge case:** if wake-word is on and Kesh is "awake" waiting for your
command, manually clicking the mic button to interrupt can turn off the
passive wake-word listener along with stopping that one utterance, instead of
just stopping the utterance. Toggling wake-word off then on again in Settings
recovers it. This doesn't affect push-to-talk or hands-free mode used on
their own — only this specific combination.

### Known limitations at this stage
- No login/auth yet — single shared user for now
- Wake word uses the mic continuously in the background while enabled — same
  privacy consideration as hands-free mode

---

## Stage 5 update — Languages & Themes

### Settings panel
Click the ⚙ icon at the bottom of the sidebar.

- **Appearance**: 4 themes — Amber (JARVIS default), Crimson, Violet, Light. Persists across reloads via `localStorage`.
- **Language**: 10 languages (English US/UK/India, Hindi, Spanish, French, German, Japanese, Portuguese, Arabic). Changes both what Kesh listens for *and* filters the voice/accent picker to matching voices. Also persists.

### How language wiring works
Changing the language dropdown:
1. Restarts the speech recognition engine listening in the new language
2. Clears your previously selected voice so the app can auto-pick one that actually speaks the new language
3. Filters the voice/accent dropdown (in the main chat voice controls) down to voices matching that language — falls back to showing all voices if your OS has none installed for it

**Note:** actual available languages/accents depend entirely on what's installed on your OS. Windows/Mac both let you download more voices for free (Windows Settings → Time & Language → Speech; Mac System Settings → Accessibility → Spoken Content).

### Known limitations at this stage
- No login/auth yet — single shared user for now
- Settings only reachable from the normal chat view, not from full-screen orb mode yet
- Mobile: no hamburger menu yet to reopen the sidebar once hidden

---

## Stage 4 update — The JARVIS Orb

Full-screen mode is here. Click **"⛶ Talk to Kesh"** in the sidebar to enter it.

### What it does
- A real Three.js particle sphere (three layers, amber/gold/ember, additive blending) — not a static image, actually rendered and animated in-browser
- **Idle**: slow rotation, gentle breathing pulse
- **Listening**: shrinks slightly, then reacts live to *your actual voice volume* — talk louder, it swells more
- **Thinking**: tightens and spins faster while waiting on the backend
- **Speaking**: expands and pulses in sync with each word Kesh says (via the browser's word-boundary events), with a smooth decay between pulses — this is the "shrink, then swell, then loop" behavior you asked for
- HUD corner brackets + status label + live caption of the last reply, styled to match the reference images
- All state transitions are eased (not instant jumps) for that smooth, alive feeling

### Try it
1. Click "Talk to Kesh"
2. Click the 🎙 button and ask something — watch the orb react to your voice
3. Watch it tighten while Kesh thinks, then pulse as she answers
4. Turn on hands-free and interrupt her mid-sentence — orb should snap back to listening instantly
5. ✕ top-right to return to normal chat

### Known limitations at this stage
- No login/auth yet — single shared user for now
- Mobile: no hamburger menu yet to reopen the sidebar once hidden — coming with Stage 5 polish
- Orb currently only in the browser tab, not yet wrapped as a desktop app (Stage 6)

---

## Stage 7 update — Authentication

Real login/signup screen now — this is the first thing you see if you're not
logged in. Your session persists across reloads (JWT stored in `localStorage`).

### What changed
- New `AuthScreen.jsx` — toggles between login and signup, shown whenever
  there's no valid stored token
- `api.js` now attaches your token as an `Authorization: Bearer ...` header
  on every backend call, and automatically logs you out if the backend
  rejects a request as unauthorized (expired/invalid token)
- Sidebar now shows a profile section at the bottom: avatar initial, username,
  email, and a logout button
- Chat history is now genuinely private per-account, enforced on the backend

### Try it
1. Make sure your backend is running with `JWT_SECRET` set (see its README)
2. `npm run dev`, you should land on the login/signup screen
3. Sign up with a username (3+ chars), email, and password (8+ chars)
4. You're in — chats you create now belong to that account only

### Known limitations at this stage
- No "forgot password" flow yet
- No token refresh — sessions last 7 days (configurable in the backend), then
  you'll need to log in again rather than being silently renewed
- No email verification — signup is instant
