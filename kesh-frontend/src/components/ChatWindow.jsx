import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble.jsx'
import { MicIcon, SendIcon, VoiceCircleIcon } from './Icons.jsx'

const SUGGESTIONS = [
  "What can you help me with?",
  "Give me a fun fact",
  "Help me plan my day",
  "Tell me the weather",
]

// Files we can actually read the contents of right now, client-side.
// PDFs and images need real backend extraction/OCR — flagged as a next stage.
const READABLE_TEXT_TYPES = ['text/plain', 'text/markdown', 'text/csv', 'application/json']
const READABLE_TEXT_EXT = /\.(txt|md|csv|json|log)$/i

export default function ChatWindow({ messages, onSend, sending, voice, onOpenOrb }) {
  const [input, setInput] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)
  const [attachedText, setAttachedText] = useState(null)
  const [attachError, setAttachError] = useState(null)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const textAreaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = input.trim()
    if ((!trimmed && !attachedFile) || sending) return

    let finalText = trimmed
    if (attachedFile) {
      if (attachedText) {
        finalText = `${trimmed}\n\n[Attached file: ${attachedFile.name}]\n---\n${attachedText}\n---`
      } else {
        finalText = `${trimmed}\n[Attached: ${attachedFile.name} — I can't read this file type yet, only .txt/.md/.csv/.json for now.]`
      }
    }

    onSend(finalText)
    setInput('')
    setAttachedFile(null)
    setAttachedText(null)
    setAttachError(null)
  }

  function handleSuggestionTap(text) {
    if (sending) return
    onSend(text)
  }

  function handlePushToTalk() {
    if (voice.micState === 'listening') {
      voice.stopListening()
    } else {
      voice.startListening()
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setAttachedFile(file)
    setAttachedText(null)
    setAttachError(null)

    const isReadable = READABLE_TEXT_TYPES.includes(file.type) || READABLE_TEXT_EXT.test(file.name)
    if (!isReadable) {
      setAttachError("Jarvis can read .txt, .md, .csv, and .json for now — PDF/image reading is coming soon.")
      return
    }

    if (file.size > 300_000) {
      setAttachError("That file's a bit large — try something under 300KB for now.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => setAttachedText(String(reader.result).slice(0, 12000))
    reader.onerror = () => setAttachError("Couldn't read that file.")
    reader.readAsText(file)
  }

  function removeAttachment() {
    setAttachedFile(null)
    setAttachedText(null)
    setAttachError(null)
  }

  function autoGrow() {
    const el = textAreaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.length === 0 && (
          <div className="welcome">
            <h1>Hey, I'm Jarvis.</h1>
            <p>Ask me anything — I'll figure out whether to think it through locally or check online.</p>
            <div className="suggestion-chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="suggestion-chip" onClick={() => handleSuggestionTap(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} brainUsed={m.brainUsed} />
        ))}
        {sending && (
          <div className="message-row assistant">
            <div className="bubble typing">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        {attachedFile && (
          <div className="attachment-chip">
            {attachedText ? '📄' : '⚠️'} {attachedFile.name}
            <button type="button" className="attachment-remove" onClick={removeAttachment}>✕</button>
          </div>
        )}
        {attachError && <div className="attachment-error">{attachError}</div>}

        <div className="input-pill">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
          <button
            type="button"
            className="pill-btn attach-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach a file (.txt, .md, .csv, .json)"
          >
            +
          </button>

          <textarea
            ref={textAreaRef}
            rows={1}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoGrow() }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder={voice.micState === 'listening' ? 'Listening...' : 'Message Jarvis...'}
            disabled={sending}
          />

          <button
            type="button"
            className={`pill-btn mic-inline-btn ${voice.micState}`}
            onClick={handlePushToTalk}
            title="Push to talk"
          >
            <MicIcon size={17} />
          </button>

          {input.trim() || attachedFile ? (
            <button type="submit" className="pill-btn send-btn" disabled={sending} title="Send">
              <SendIcon size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="pill-btn voice-mode-btn"
              onClick={onOpenOrb}
              title="Voice mode"
            >
              <VoiceCircleIcon size={19} />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
