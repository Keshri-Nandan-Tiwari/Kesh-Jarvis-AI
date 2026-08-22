import { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ChatWindow from './components/ChatWindow.jsx'
import OrbView from './components/OrbView.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import VoiceDebugPanel from './components/VoiceDebugPanel.jsx'
import { sendMessage, getSessions, getHistory, checkHealth, getStoredUser, clearAuth, AuthError } from './api.js'
import { useVoiceAssistant } from './hooks/useVoiceAssistant.js'

export default function App() {
  const [user, setUser] = useState(() => getStoredUser())
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [backendOnline, setBackendOnline] = useState(true)
  const [viewMode, setViewMode] = useState('orb') // 'chat' | 'orb' | 'debug'
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const [theme, setTheme] = useState(() => localStorage.getItem('kesh-theme') || 'amber')
  const [language, setLanguage] = useState(() => localStorage.getItem('kesh-lang') || 'en-US')
  const [responseStyle, setResponseStyle] = useState(() => localStorage.getItem('kesh-style') || 'balanced')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('kesh-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('kesh-lang', language)
  }, [language])

  useEffect(() => {
    localStorage.setItem('kesh-style', responseStyle)
  }, [responseStyle])

  // handleSend is defined below but referenced by the voice hook before
  // its declaration is hoisted, so we route through a ref to avoid
  // stale-closure issues inside the hook's event handlers.
  const handleSendRef = useRef(() => {})

  const voice = useVoiceAssistant({
    onFinalTranscript: (text) => handleSendRef.current(text, 'voice'),
    lang: language,
    onDebug: (text) => setMessages((prev) => [...prev, { role: 'assistant', content: text, brainUsed: 'debug' }]),
  })

  const refreshSessions = useCallback(async () => {
    try {
      const data = await getSessions()
      setSessions(data)
    } catch (err) {
      if (err instanceof AuthError) setUser(null)
      // else: backend not reachable yet, handled by health check below
    }
  }, [])

  useEffect(() => {
    checkHealth().then(setBackendOnline)
    if (user) refreshSessions()
  }, [refreshSessions, user])

  async function handleSelectSession(sessionId) {
    setActiveSessionId(sessionId)
    try {
      const history = await getHistory(sessionId)
      setMessages(history.map((m) => ({
        role: m.role,
        content: m.content,
        brainUsed: m.brainUsed,
      })))
    } catch (err) {
      if (err instanceof AuthError) setUser(null)
      else console.error(err)
    }
  }

  function handleNewChat() {
    setActiveSessionId(null)
    setMessages([])
  }

  function handleLogout() {
    clearAuth()
    setUser(null)
    setSessions([])
    setActiveSessionId(null)
    setMessages([])
  }

  async function handleSend(text, source = 'text') {
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setSending(true)
    try {
      const res = await sendMessage(text, activeSessionId, 'auto', responseStyle)
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: res.reply,
        brainUsed: res.brainUsed,
      }])
      // Only speak the reply out loud if this exchange was voice-initiated
      // (mic tap, hands-free, or wake word) — typed chat stays silent so
      // Jarvis doesn't talk over you while you're reading/typing.
      if (source === 'voice') {
        voice.speak(res.reply)
      }
      if (!activeSessionId) {
        setActiveSessionId(res.sessionId)
        refreshSessions()
      }
      setBackendOnline(true)
    } catch (err) {
      if (err instanceof AuthError) {
        setUser(null)
      } else {
        setBackendOnline(false)
        const offlineMsg = navigator.onLine
          ? "I couldn't reach the server just now — it might be waking up (free servers sleep after inactivity) or there's a temporary connection issue. Give it a few seconds and try again."
          : "Looks like you're offline. Check your internet connection and try again."
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: offlineMsg,
        }])
      }
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    handleSendRef.current = handleSend
  })

  // Unified state for the orb: sending a request to the backend counts as
  // "thinking" regardless of what the mic is doing at that moment.
  const orbState = sending ? 'thinking' : voice.micState

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant')

  function handleVoiceDictation(text) {
    handleSend(text, 'voice')
  }

  if (!user) {
    return <AuthScreen onAuthenticated={(data) => setUser({ username: data.username, email: data.email })} />
  }

  return (
    <div className="app">
      {viewMode === 'chat' && (
        <>
          <button
            className="mobile-hamburger"
            onClick={() => setMobileSidebarOpen((v) => !v)}
          >
            {mobileSidebarOpen ? '✕' : '☰'}
          </button>
          <Sidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={(id) => { handleSelectSession(id); setMobileSidebarOpen(false) }}
            onNewChat={() => { handleNewChat(); setMobileSidebarOpen(false) }}
            backendOnline={backendOnline}
            onOpenOrb={() => { setViewMode('orb'); setMobileSidebarOpen(false) }}
            onOpenSettings={() => setSettingsOpen(true)}
            mobileOpen={mobileSidebarOpen}
            user={user}
            onLogout={handleLogout}
          />
          <ChatWindow messages={messages} onSend={handleSend} sending={sending} voice={voice} onOpenOrb={() => setViewMode('orb')} />
        </>
      )}

      {viewMode === 'orb' && (
        <OrbView
          orbState={orbState}
          voice={voice}
          onExit={() => setViewMode('chat')}
          onSubmitVoiceText={handleVoiceDictation}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        language={language}
        setLanguage={setLanguage}
        responseStyle={responseStyle}
        setResponseStyle={setResponseStyle}
        voice={voice}
        onOpenDebug={() => { setSettingsOpen(false); setViewMode('debug') }}
      />

      {viewMode === 'debug' && (
        <VoiceDebugPanel onClose={() => setViewMode('orb')} />
      )}
    </div>
  )
}
