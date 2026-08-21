import { useRef, useState } from 'react'

// Minimal, standalone diagnostic tool: creates its OWN SpeechRecognition
// instance (completely separate from the main app's voice hook) and logs
// every single lifecycle event with a timestamp, directly to the screen.
// Purpose: get ground truth about what the browser is actually doing,
// with zero interference from our app's debounce/commit logic.
export default function VoiceDebugPanel({ onClose }) {
  const [log, setLog] = useState([])
  const [running, setRunning] = useState(false)
  const recognitionRef = useRef(null)
  const startTimeRef = useRef(0)

  function addLine(text) {
    const elapsed = ((performance.now() - startTimeRef.current) / 1000).toFixed(2)
    setLog((prev) => [...prev, `[+${elapsed}s] ${text}`])
  }

  function runTest() {
    setLog([])
    startTimeRef.current = performance.now()
    setRunning(true)

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      addLine('SpeechRecognition API not available in this browser at all.')
      setRunning(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => addLine('onstart fired — recognition session began.')
    recognition.onaudiostart = () => addLine('onaudiostart fired — mic audio capture began.')
    recognition.onsoundstart = () => addLine('onsoundstart fired — some sound detected.')
    recognition.onspeechstart = () => addLine('onspeechstart fired — speech detected.')
    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1]
      const transcript = last[0].transcript
      const isFinal = last.isFinal
      addLine(`onresult fired — text: "${transcript}" — isFinal: ${isFinal}`)
    }
    recognition.onspeechend = () => addLine('onspeechend fired — speech ended.')
    recognition.onsoundend = () => addLine('onsoundend fired — sound ended.')
    recognition.onaudioend = () => addLine('onaudioend fired — mic audio capture ended.')
    recognition.onerror = (e) => addLine(`onerror fired — error: "${e.error}" message: "${e.message || ''}"`)
    recognition.onend = () => {
      addLine('onend fired — recognition session fully ended.')
      setRunning(false)
    }

    recognitionRef.current = recognition
    addLine('Calling recognition.start() now...')
    try {
      recognition.start()
    } catch (err) {
      addLine(`recognition.start() threw synchronously: ${err.message}`)
      setRunning(false)
    }
  }

  function stopTest() {
    recognitionRef.current?.stop()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0a0908', zIndex: 999,
      padding: '20px', overflowY: 'auto', color: '#e8d9c0', fontFamily: 'monospace',
    }}>
      <h2 style={{ color: '#e8a33d', marginBottom: 8 }}>Raw Mic Diagnostic</h2>
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 20, right: 20, padding: '8px 14px', background: '#333', color: '#e8d9c0', border: 'none', borderRadius: 6 }}
      >
        ✕ Close
      </button>
      <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
        This bypasses all of Jarvis's normal logic and talks to the browser's
        speech API directly. Tap Start, say something, wait — every raw event
        Chrome fires (or doesn't fire) will show up below with a timestamp.
      </p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          onClick={runTest}
          disabled={running}
          style={{ padding: '10px 18px', background: '#e8a33d', color: '#1a1410', border: 'none', borderRadius: 6, fontWeight: 700 }}
        >
          {running ? 'Running…' : 'Start Raw Test'}
        </button>
        <button
          onClick={stopTest}
          disabled={!running}
          style={{ padding: '10px 18px', background: '#333', color: '#e8d9c0', border: 'none', borderRadius: 6 }}
        >
          Stop
        </button>
      </div>
      <div style={{ background: '#151311', border: '1px solid #333', borderRadius: 8, padding: 14, minHeight: 200 }}>
        {log.length === 0 && <p style={{ opacity: 0.5 }}>No events yet — tap Start Raw Test.</p>}
        {log.map((line, i) => (
          <div key={i} style={{ fontSize: 12.5, marginBottom: 4, whiteSpace: 'pre-wrap' }}>{line}</div>
        ))}
      </div>
    </div>
  )
}
