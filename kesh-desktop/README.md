# Kesh Desktop — Stage 6 (Tauri wrapper)

Wraps the existing `kesh-frontend` React app into a native Windows/Mac/Linux
app. No new logic here — it just hosts your already-working frontend in a
proper desktop window instead of a browser tab. Free and open-source, unlike
Electron-based alternatives it produces a much smaller binary (a few MB vs
~150MB) because it uses your OS's built-in web renderer instead of bundling
Chromium.

This folder must sit **next to** `kesh-frontend` (not inside it) — the paths
in `tauri.conf.json` assume that layout:
```
some-folder/
  kesh-backend/
  kesh-frontend/
  kesh-desktop/   <- this one
```

## Prerequisites
1. **Rust** — https://www.rust-lang.org/tools/install (free, required by Tauri)
2. **Tauri OS dependencies** — platform-specific, all free:
   - Windows: Microsoft C++ Build Tools + WebView2 (usually preinstalled on Win 11)
   - Mac: Xcode Command Line Tools (`xcode-select --install`)
   - Linux: see https://v2.tauri.app/start/prerequisites/ for your distro's packages
3. Node.js (you already have this from Stage 2)

## Setup
```bash
cd kesh-desktop
npm install
```

## Add an icon (required before first build)
Tauri needs real icon files, not placeholders. Once you have a Kesh logo image
(even a simple one — 1024x1024 PNG is ideal), generate all required sizes:
```bash
npx tauri icon path/to/your-logo.png
```
This fills in `src-tauri/icons/` automatically.

## Run in development
Make sure your backend is running first (`cd kesh-backend && mvn spring-boot:run`),
then:
```bash
npm run tauri dev
```
This launches kesh-frontend's dev server AND opens it in a native window.

## Build a real installer
```bash
npm run tauri build
```
Output lands in `src-tauri/target/release/bundle/` — a `.msi`/`.exe` on Windows,
`.dmg`/`.app` on Mac, `.deb`/`.AppImage` on Linux. This is the actual
double-click-to-install Kesh app.

## Known limitations at this stage
- The backend (`kesh-backend`) still needs to be running separately — this
  wrapper doesn't bundle or auto-start it. A future improvement would be to
  have Tauri spawn the Spring Boot jar as a sidecar process on launch.
- I could not test-build this here — no Rust toolchain or internet access in
  this sandbox. Please run it and paste back any error verbatim.
- Wake-word mode has a known edge case: if wake-word is on and you manually
  click the mic to interrupt while Kesh is "awake" listening for your command,
  it can stop the passive wake-word listener along with the current utterance
  instead of just the utterance. Toggle wake-word off/on in Settings to recover.
  Push-to-talk and hands-free mode alone don't have this issue.
