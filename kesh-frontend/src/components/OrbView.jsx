import { useState, useRef, useEffect } from 'react'
import KeshOrb from './KeshOrb.jsx'
import { MicIcon } from './Icons.jsx'

const STATUS_LABEL = {
  idle: 'Ready',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking…',
}

// Chrome's in-browser SpeechRecognition is unreliable on a lot of Android
// devices — it can silently never fire a result at all, even though the
// phone's own keyboard dictation (Gboard etc.) works perfectly. Rather than
// depend on the flaky browser API, tapping the mic opens a small dictation
// box: the on-screen keyboard appears with its own (reliable) mic button
// right there for you to use, and submitting sends it to Jarvis exactly
// like a spoken message — including getting a spoken reply back.
//
// IMPORTANT: the text input below is intentionally UNCONTROLLED (no
// value/onChange wired to React state on every keystroke). A fully
// React-controlled input re-renders on every character, and on some
// Android WebViews that fights with the keyboard's own voice-typing
// overlay writing directly into the field — causing it to kick back to
// the normal keyboard the instant you tap its mic. Reading the value
// only once, at submit time, avoids that fight entirely.
//
// CONTINUOUS MODE: true always-on hands-free listening isn't reliably
// possible from a webpage — the OS keyboard's mic requires a manual tap,
// browsers don't let JS auto-trigger it. This gets as close as honestly
// possible: after Jarvis finishes speaking, the dictation box reopens on
// its own, so continuing the conversation is just one tap (the keyboard's
// mic) instead of two. Tapping mic any time — including mid-reply —
// immediately stops Jarvis talking, so you can always interrupt.
export default function OrbView({ orbState, voice, onExit, onSubmitVoiceText, onOpenSettings, lastUserMessage, lastAssistantMessage }) {
  const [dictating, setDictating] = useState(false)
  const [continuousMode, setContinuousMode] = useState(true)
  const inputRef = useRef(null)
  const prevOrbStateRef = useRef(orbState)

  useEffect(() => {
    if (dictating) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [dictating])

  // Auto-reopen the dictation box once Jarvis finishes speaking, if
  // Continuous Mode is on — makes back-and-forth feel like one flow
  // instead of having to tap the big mic button again every single time.
  useEffect(() => {
    const wasSpeaking = prevOrbStateRef.current === 'speaking'
    const nowIdle = orbState === 'idle'
    if (wasSpeaking && nowIdle && continuousMode && !dictating) {
      const t = setTimeout(() => setDictating(true), 400)
      prevOrbStateRef.current = orbState
      return () => clearTimeout(t)
    }
    prevOrbStateRef.current = orbState
  }, [orbState, continuousMode, dictating])

  function openDictation() {
    // Tapping mic always interrupts — if Jarvis is mid-reply, stop it now.
    window.speechSynthesis.cancel()
    setDictating(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = (inputRef.current?.value || '').trim()
    if (!trimmed) {
      setDictating(false)
      return
    }
    onSubmitVoiceText(trimmed)
    if (inputRef.current) inputRef.current.value = ''
    setDictating(false)
  }

  const showExchange = !dictating && (lastUserMessage || lastAssistantMessage)

  return (
    <div className="orb-view">
      <div className="orb-topbar">
        <div className="jarvis-wordmark">
          <span className="jarvis-wordmark-ring" />
          <span className="jarvis-wordmark-text">JARVIS</span>
        </div>
        <div className="orb-topbar-actions">
          <button className="orb-settings-btn" onClick={onOpenSettings} title="Settings">⚙</button>
          <button className="orb-exit-btn" onClick={onExit} title="Back to chat">✕</button>
        </div>
      </div>

      <div className="orb-hud-corner top-left" />
      <div className="orb-hud-corner top-right" />
      <div className="orb-hud-corner bottom-left" />
      <div className="orb-hud-corner bottom-right" />

      <KeshOrb
        state={orbState}
        micLevelRef={voice.micLevelRef}
        speechPulseRef={voice.speechPulseRef}
      />

      <div className="orb-status">{STATUS_LABEL[orbState] || 'Ready'}</div>

      {showExchange && (
        <div className="orb-caption">
          {lastUserMessage && <p className="orb-caption-user">You: {lastUserMessage}</p>}
          {lastAssistantMessage && <p className="orb-caption-reply">{lastAssistantMessage}</p>}
        </div>
      )}

      {dictating ? (
        <form className="orb-dictation-bar" onSubmit={handleSubmit}>
          <button type="button" className="orb-dictation-cancel" onClick={() => setDictating(false)} title="Cancel">✕</button>
          <input
            ref={inputRef}
            type="text"
            defaultValue=""
            placeholder="Tap your keyboard's mic to talk, or type…"
          />
          <button type="submit" className="orb-dictation-send">➤</button>
        </form>
      ) : (
        <div className="orb-controls">
          <button
            className="orb-mic-btn"
            onClick={openDictation}
            title="Talk to Jarvis"
          >
            <MicIcon size={24} />
          </button>
          <button
            className={`handsfree-toggle ${continuousMode ? 'on' : ''}`}
            onClick={() => setContinuousMode((v) => !v)}
            title="Automatically reopen the mic after each reply"
          >
            {continuousMode ? '🔁 Continuous: ON' : '🔁 Continuous: OFF'}
          </button>
        </div>
      )}
    </div>
  )
}
