import { useRef, useState, useCallback, useEffect } from 'react'

/**
 * Wraps the browser's native SpeechRecognition (STT) and
 * SpeechSynthesis (TTS) APIs into one hook, with barge-in support:
 * if the user starts talking while Jarvis is speaking, Jarvis stops
 * instantly and starts listening to the new input.
 *
 * IMPORTANT #1: mobile Chrome's SpeechRecognition finalizes short clauses
 * very eagerly — it can fire multiple separate "final" results while
 * you're still mid-sentence. We accumulate final chunks into a buffer and
 * only send once ~1.1s of silence has passed with no new speech.
 *
 * IMPORTANT #2: on some devices, recognition ends (onend) WITHOUT ever
 * marking a result "final" — especially for short utterances. If we only
 * ever sent on finalized chunks, that speech would be silently lost (you'd
 * see "Listening..." and then just... nothing). As a safety net, onend
 * also checks the best-guess full transcript captured so far (final OR
 * interim) and sends that if nothing was already sent for this session.
 *
 * IMPORTANT #3: mobile browsers block audio (including text-to-speech)
 * from playing until the page has received a genuine user tap/click.
 * We "unlock" speechSynthesis on the very first tap anywhere in the app,
 * so Jarvis's voice replies work immediately rather than only after you
 * happen to interact with something like the settings menu.
 */
const SILENCE_COMMIT_MS = 1100
const MAX_BUFFER_MS = 4000 // hard cap: commit even mid-flow if fragments keep resetting the silence timer

export function useVoiceAssistant({ onFinalTranscript, lang = 'en-US', onDebug }) {
  const [micState, setMicState] = useState('idle') // idle | listening | speaking
  const [supported, setSupported] = useState(true)
  const [voices, setVoices] = useState([])
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(null)
  const [handsFree, setHandsFree] = useState(false)
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false)

  const recognitionRef = useRef(null)
  const handsFreeRef = useRef(false)
  const intentionalStopRef = useRef(false)
  const noSpeechRetryRef = useRef(0)

  const wakeWordEnabledRef = useRef(false)
  const manualListenRef = useRef(false)
  const awakeRef = useRef(false)
  const awakeGraceTimeoutRef = useRef(null) // gives you time to start talking after the wake phrase
  const WAKE_PHRASES = ['hey jarvis', 'hi jarvis', 'ok jarvis', 'okay jarvis']

  const pendingTranscriptRef = useRef('')
  const silenceTimerRef = useRef(null)
  const maxBufferTimerRef = useRef(null) // hard cap so buffering never waits forever
  const latestFullTranscriptRef = useRef('') // best-guess whole-session transcript, final or not
  const consumedResultCountRef = useRef(0) // how many of the session's results we've already sent, so we never re-include old turns
  const latestEventResultsLengthRef = useRef(0)
  const onDebugRef = useRef(onDebug)

  useEffect(() => {
    onDebugRef.current = onDebug
  }, [onDebug])

  const micLevelRef = useRef(0)
  const speechPulseRef = useRef(0)

  const syntheticRafRef = useRef(null)

  const startSyntheticPulse = useCallback(() => {
    if (syntheticRafRef.current) return
    const tick = () => {
      const t = performance.now() / 1000
      micLevelRef.current = 0.35 + 0.3 * Math.abs(Math.sin(t * 2.3)) + 0.1 * Math.abs(Math.sin(t * 5.1))
      syntheticRafRef.current = requestAnimationFrame(tick)
    }
    tick()
  }, [])

  const stopSyntheticPulse = useCallback(() => {
    if (syntheticRafRef.current) cancelAnimationFrame(syntheticRafRef.current)
    syntheticRafRef.current = null
    micLevelRef.current = 0
  }, [])

  useEffect(() => {
    handsFreeRef.current = handsFree
  }, [handsFree])

  useEffect(() => {
    wakeWordEnabledRef.current = wakeWordEnabled
  }, [wakeWordEnabled])

  // --- Unlock speechSynthesis on the first tap that ISN'T the mic button.
  // (Deliberately not tied to the mic tap itself, to avoid any chance of
  // the audio-output priming call and mic-input startup competing for the
  // device's audio session at the exact same instant.) ---
  useEffect(() => {
    function unlockAudio(e) {
      if (e.target?.closest?.('.mic-inline-btn, .orb-mic-btn')) return
      try {
        const primer = new SpeechSynthesisUtterance('')
        primer.volume = 0
        window.speechSynthesis.speak(primer)
      } catch { /* ignore */ }
      document.removeEventListener('pointerdown', unlockAudio)
    }
    document.addEventListener('pointerdown', unlockAudio)
    return () => document.removeEventListener('pointerdown', unlockAudio)
  }, [])

  const commitPendingTranscript = useCallback((recognition) => {
    consumedResultCountRef.current = latestEventResultsLengthRef.current
    const text = pendingTranscriptRef.current.trim()
    pendingTranscriptRef.current = ''
    latestFullTranscriptRef.current = ''
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (maxBufferTimerRef.current) {
      clearTimeout(maxBufferTimerRef.current)
      maxBufferTimerRef.current = null
    }
    if (!text) return

    noSpeechRetryRef.current = 0
    onFinalTranscript(text)
    awakeRef.current = false

    if (!handsFreeRef.current && !wakeWordEnabledRef.current) {
      // Push-to-talk: one utterance and done.
      intentionalStopRef.current = true
      recognition.stop()
      setMicState('idle')
      stopSyntheticPulse()
    } else if (wakeWordEnabledRef.current && !handsFreeRef.current) {
      // Wake-word mode: go back to passive listening for the next "Hey Jarvis".
      setMicState('idle')
    }
    // Hands-free: recognition just keeps running, mic state stays as-is.
  }, [onFinalTranscript, stopSyntheticPulse])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang

    recognition.onresult = (event) => {
      let finalChunk = ''
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalChunk += transcript
        } else {
          interimText += transcript
        }
      }

      // Best-guess full transcript across the whole session so far (used as
      // a fallback in onend if nothing ever got marked "final"). Only counts
      // results since the last successful commit, so a long hands-free
      // conversation never re-includes text from turns already sent.
      latestEventResultsLengthRef.current = event.results.length
      let wholeSession = ''
      for (let i = consumedResultCountRef.current; i < event.results.length; i++) {
        wholeSession += event.results[i][0].transcript
      }
      latestFullTranscriptRef.current = wholeSession

      if ((interimText.trim() || finalChunk.trim()) && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
        setMicState('listening')
      }

      // Wake-word mode, not yet awake: only look for the trigger phrase.
      if (wakeWordEnabledRef.current && !manualListenRef.current && !handsFreeRef.current && !awakeRef.current) {
        const lowerFinal = finalChunk.toLowerCase()
        const matchedPhrase = WAKE_PHRASES.find((p) => lowerFinal.includes(p))
        if (matchedPhrase) {
          awakeRef.current = true
          setMicState('listening')
          const remainder = lowerFinal.split(matchedPhrase)[1]?.trim()
          if (remainder) {
            pendingTranscriptRef.current = remainder
          }
          if (awakeGraceTimeoutRef.current) clearTimeout(awakeGraceTimeoutRef.current)
          awakeGraceTimeoutRef.current = setTimeout(() => {
            if (!pendingTranscriptRef.current.trim()) {
              awakeRef.current = false
              setMicState('idle')
            }
          }, 6000)
        }
        return
      }

      // Actively capturing an utterance (push-to-talk, hands-free, or awake-after-wake-word).
      if (finalChunk.trim()) {
        const wasEmpty = !pendingTranscriptRef.current.trim()
        pendingTranscriptRef.current = (pendingTranscriptRef.current + ' ' + finalChunk).trim()
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = setTimeout(() => commitPendingTranscript(recognition), SILENCE_COMMIT_MS)
        // Start the hard cap only on the first chunk of a fresh utterance —
        // this guarantees a commit within MAX_BUFFER_MS even if fragments
        // keep arriving fast enough to keep resetting the silence timer.
        if (wasEmpty) {
          if (maxBufferTimerRef.current) clearTimeout(maxBufferTimerRef.current)
          maxBufferTimerRef.current = setTimeout(() => commitPendingTranscript(recognition), MAX_BUFFER_MS)
        }
      }
    }

    recognition.onend = () => {
      // Safety net: whatever text we have — the officially-finalized buffer
      // (pendingTranscriptRef) if any, otherwise the best-guess whole-session
      // transcript (latestFullTranscriptRef, which includes interim text) —
      // gets sent now if the session ended before the normal silence-timer
      // commit had a chance to fire. This closes the gap where fast-talking
      // or background noise kept resetting the silence timer so it never
      // actually elapsed, leaving captured speech stuck in the buffer and
      // silently lost when the session ended.
      const wasActivelyListening = manualListenRef.current || handsFreeRef.current || awakeRef.current
      const pending = pendingTranscriptRef.current.trim()
      const fallback = latestFullTranscriptRef.current.trim()
      const textToSend = pending || fallback

      pendingTranscriptRef.current = ''
      latestFullTranscriptRef.current = ''
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      if (maxBufferTimerRef.current) {
        clearTimeout(maxBufferTimerRef.current)
        maxBufferTimerRef.current = null
      }

      if (!intentionalStopRef.current && wasActivelyListening) {
        if (textToSend) {
          noSpeechRetryRef.current = 0
          awakeRef.current = false
          consumedResultCountRef.current = latestEventResultsLengthRef.current
          onFinalTranscript(textToSend)
        } else if (onDebugRef.current) {
          onDebugRef.current(`Jarvis didn't pick up any speech that time (mic opened but captured nothing — online: ${navigator.onLine}).`)
        }
      }

      if ((handsFreeRef.current || wakeWordEnabledRef.current) && !intentionalStopRef.current) {
        consumedResultCountRef.current = 0
        latestEventResultsLengthRef.current = 0
        try { recognition.start() } catch { /* already started, ignore */ }
      } else if (manualListenRef.current && !intentionalStopRef.current && noSpeechRetryRef.current < 2 && !textToSend) {
        noSpeechRetryRef.current += 1
        consumedResultCountRef.current = 0
        latestEventResultsLengthRef.current = 0
        try { recognition.start() } catch { setMicState('idle') }
      } else {
        noSpeechRetryRef.current = 0
        setMicState('idle')
        stopSyntheticPulse()
      }
      intentionalStopRef.current = false
    }

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') {
        setSupported(false)
      }
      if (onDebugRef.current && e.error !== 'aborted') {
        onDebugRef.current(`Jarvis's mic hit an error: "${e.error}". ${e.message ? e.message : ''}`.trim())
      }
    }

    recognitionRef.current = recognition

    return () => {
      intentionalStopRef.current = true
      recognition.stop()
      stopSyntheticPulse()
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      if (maxBufferTimerRef.current) clearTimeout(maxBufferTimerRef.current)
      if (awakeGraceTimeoutRef.current) clearTimeout(awakeGraceTimeoutRef.current)
    }
  }, [lang, commitPendingTranscript, stopSyntheticPulse])

  useEffect(() => {
    setSelectedVoiceURI(null)
  }, [lang])

  useEffect(() => {
    function loadVoices() {
      const list = window.speechSynthesis.getVoices()
      if (list.length) {
        setVoices(list)
        if (!selectedVoiceURI) {
          const defaultVoice = list.find((v) => v.lang.startsWith(lang.split('-')[0])) || list[0]
          setSelectedVoiceURI(defaultVoice?.voiceURI ?? null)
        }
      }
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }, [lang, selectedVoiceURI])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    intentionalStopRef.current = false
    manualListenRef.current = true
    noSpeechRetryRef.current = 0
    pendingTranscriptRef.current = ''
    latestFullTranscriptRef.current = ''
    consumedResultCountRef.current = 0
    latestEventResultsLengthRef.current = 0
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    if (maxBufferTimerRef.current) { clearTimeout(maxBufferTimerRef.current); maxBufferTimerRef.current = null }
    setMicState('listening')
    try { recognitionRef.current.start() } catch { /* already running */ }
    startSyntheticPulse()
  }, [startSyntheticPulse])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    intentionalStopRef.current = true
    manualListenRef.current = false
    recognitionRef.current.stop()
    setMicState('idle')
    stopSyntheticPulse()
  }, [stopSyntheticPulse])

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const voice = voices.find((v) => v.voiceURI === selectedVoiceURI)
    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang || lang
    utterance.rate = 1.02
    utterance.pitch = 1.0

    utterance.onstart = () => setMicState('speaking')
    utterance.onend = () => setMicState(handsFreeRef.current ? 'listening' : 'idle')
    utterance.onerror = () => setMicState('idle')
    utterance.onboundary = () => { speechPulseRef.current = performance.now() }

    window.speechSynthesis.speak(utterance)
  }, [voices, selectedVoiceURI, lang])

  const toggleHandsFree = useCallback(() => {
    setHandsFree((prev) => {
      const next = !prev
      if (next) {
        startListening()
      } else {
        stopListening()
        window.speechSynthesis.cancel()
      }
      return next
    })
  }, [startListening, stopListening])

  const toggleWakeWord = useCallback(() => {
    setWakeWordEnabled((prev) => {
      const next = !prev
      if (next) {
        if (recognitionRef.current) {
          intentionalStopRef.current = false
          manualListenRef.current = false
          consumedResultCountRef.current = 0
          latestEventResultsLengthRef.current = 0
          try { recognitionRef.current.start() } catch { /* already running */ }
        }
      } else {
        awakeRef.current = false
        pendingTranscriptRef.current = ''
        latestFullTranscriptRef.current = ''
        if (awakeGraceTimeoutRef.current) clearTimeout(awakeGraceTimeoutRef.current)
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        if (maxBufferTimerRef.current) clearTimeout(maxBufferTimerRef.current)
        if (!handsFreeRef.current && recognitionRef.current) {
          intentionalStopRef.current = true
          recognitionRef.current.stop()
        }
        setMicState('idle')
      }
      return next
    })
  }, [])

  return {
    micState,
    supported,
    voices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    handsFree,
    toggleHandsFree,
    wakeWordEnabled,
    toggleWakeWord,
    startListening,
    stopListening,
    speak,
    micLevelRef,
    speechPulseRef,
    currentLang: lang,
  }
}
