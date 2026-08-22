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
export default function OrbView({ orbState, voice, onExit, onSubmitVoiceText, onOpenSettings, lastUserMessage, lastAssistantMessage }) {
  const [dictating, setDictating] = useState(false)
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (dictating) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [dictating])

  function openDictation() {
    setText('')
    setDictating(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) {
      setDictating(false)
      return
    }
    onSubmitVoiceText(trimmed)
    setText('')
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
            value={text}
            onChange={(e) => setText(e.target.value)}
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
        </div>
      )}
    </div>
  )
}
