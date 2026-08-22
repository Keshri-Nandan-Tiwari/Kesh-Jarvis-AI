import { useRef, useState, useCallback, useEffect } from 'react'

/**
 * Speech input/output for Jarvis.
 *
 * IMPORTANT — why this is simple on purpose: an earlier version of this
 * hook used `continuous: true` + `interimResults: true`, which is far more
 * fragile on Android Chrome (results can arrive in confusing fragments, or
 * sometimes never get marked "final" at all, leaving the mic stuck
 * listening forever with nothing sent). Single-shot recognition
 * (`continuous: false`, `interimResults: false`) is the standard,
 * well-supported mode: tap, say one thing, it finalizes naturally via
 * `onend`, done. "Continuous conversation" is achieved the honest way —
 * automatically starting a fresh single-shot listen right after Jarvis
 * finishes speaking — not by trying to keep one giant recognition session
 * alive indefinitely.
 *
 * Also important: we do NOT open a second getUserMedia() audio stream for
 * mic-level visualization. Running that alongside SpeechRecognition's own
 * mic access competes for the microphone on many Android devices and can
 * silently break voice input entirely. The orb's reactivity uses a
 * lightweight simulated pulse instead.
 */
export function useVoiceAssistant({ onFinalTranscript, lang = 'en-US' }) {
  const [micState, setMicState] = useState('idle') // idle | listening | speaking
  const [supported, setSupported] = useState(true)
  const [micError, setMicError] = useState(null)
  const [voices, setVoices] = useState([])
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(null)
  const [handsFree, setHandsFree] = useState(false)

  const recognitionRef = useRef(null)
  const handsFreeRef = useRef(false)
  const langRef = useRef(lang)
  const onFinalTranscriptRef = useRef(onFinalTranscript)

  const micLevelRef = useRef(0)
  const speechPulseRef = useRef(0)
  const syntheticRafRef = useRef(null)

  useEffect(() => { handsFreeRef.current = handsFree }, [handsFree])
  useEffect(() => { langRef.current = lang }, [lang])
  useEffect(() => { onFinalTranscriptRef.current = onFinalTranscript }, [onFinalTranscript])

  // --- Simulated mic-level pulse for the orb (no real audio stream). ---
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

  // --- Unlock speechSynthesis on the first tap that isn't the mic button
  // itself, so Jarvis's spoken replies work immediately. ---
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

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setSupported(!!SpeechRecognition)
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor || micState === 'listening') return

    // Tapping mic always interrupts Jarvis if it's mid-reply.
    if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel()

    setMicError(null)
    const recognition = new SpeechRecognitionCtor()
    recognition.lang = langRef.current
    recognition.continuous = false
    recognition.interimResults = false

    let finalText = ''

    recognition.onresult = (event) => {
      finalText = event.results[0][0].transcript
    }

    recognition.onerror = (event) => {
      setMicState('idle')
      stopSyntheticPulse()
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        setSupported(false)
        setMicError("Microphone permission is blocked — allow it in Chrome's site settings for this page.")
      } else if (event?.error === 'no-speech') {
        setMicError("Didn't catch anything that time — tap the mic and try again.")
      } else {
        setMicError(`Voice input error: ${event?.error || 'unknown'}. Tap the mic to try again.`)
      }
    }

    recognition.onend = () => {
      setMicState('idle')
      stopSyntheticPulse()
      if (finalText.trim()) {
        onFinalTranscriptRef.current?.(finalText.trim())
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setMicState('listening')
      startSyntheticPulse()
    } catch {
      setMicState('idle')
    }
  }, [micState, startSyntheticPulse, stopSyntheticPulse])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  // Real hands-free conversation: the instant Jarvis finishes speaking,
  // start listening again automatically. A short delay avoids the mic
  // picking up the tail end of Jarvis's own voice.
  const wasSpeakingRef = useRef(false)
  useEffect(() => {
    const wasSpeaking = wasSpeakingRef.current
    wasSpeakingRef.current = micState === 'speaking'
    if (wasSpeaking && micState !== 'speaking' && handsFreeRef.current) {
      const t = setTimeout(() => startListening(), 500)
      return () => clearTimeout(t)
    }
  }, [micState, startListening])

  useEffect(() => {
    function loadVoices() {
      const list = window.speechSynthesis.getVoices()
      if (list.length) {
        setVoices(list)
        setSelectedVoiceURI((prev) => {
          if (prev) return prev
          const defaultVoice = list.find((v) => v.lang.startsWith(lang.split('-')[0])) || list[0]
          return defaultVoice?.voiceURI ?? null
        })
      }
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }, [lang])

  useEffect(() => {
    setSelectedVoiceURI(null)
  }, [lang])

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
    utterance.onend = () => setMicState('idle')
    utterance.onerror = () => setMicState('idle')
    utterance.onboundary = () => { speechPulseRef.current = performance.now() }

    window.speechSynthesis.speak(utterance)
  }, [voices, selectedVoiceURI, lang])

  const toggleHandsFree = useCallback(() => {
    setHandsFree((prev) => !prev)
  }, [])

  return {
    micState,
    supported,
    micError,
    voices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    handsFree,
    toggleHandsFree,
    startListening,
    stopListening,
    speak,
    micLevelRef,
    speechPulseRef,
    currentLang: lang,
  }
}
