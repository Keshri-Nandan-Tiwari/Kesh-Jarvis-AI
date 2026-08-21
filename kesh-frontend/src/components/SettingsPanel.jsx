import { LANGUAGES, THEMES } from '../constants.js'

const RESPONSE_STYLES = [
  { id: 'fast', label: 'Fast', hint: 'Short, snappy answers' },
  { id: 'balanced', label: 'Balanced', hint: 'Clear, reasonably concise' },
  { id: 'deep', label: 'Deep', hint: 'Thorough, more detail & nuance' },
]

export default function SettingsPanel({ open, onClose, theme, setTheme, language, setLanguage, responseStyle, setResponseStyle, voice, onOpenDebug }) {
  if (!open) return null

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-title-group">
            <span className="jarvis-wordmark-ring settings-mini-ring" />
            <h2>Settings</h2>
          </div>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <section className="settings-section">
          <h3>Appearance</h3>
          <p className="settings-hint">Choose how Jarvis looks.</p>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`theme-swatch ${t.id} ${theme === t.id ? 'active' : ''}`}
                onClick={() => setTheme(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {setResponseStyle && (
          <section className="settings-section">
            <h3>Response mode</h3>
            <p className="settings-hint">How much effort Jarvis puts into thinking through each reply.</p>
            <div className="style-grid">
              {RESPONSE_STYLES.map((s) => (
                <button
                  key={s.id}
                  className={`style-swatch ${responseStyle === s.id ? 'active' : ''}`}
                  onClick={() => setResponseStyle(s.id)}
                  title={s.hint}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="settings-section">
          <h3>Language</h3>
          <p className="settings-hint">
            Sets both what Jarvis listens for and the accent it replies in.
          </p>
          <select
            className="settings-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </section>

        {voice && (
          <section className="settings-section">
            <h3>Wake Word</h3>
            <p className="settings-hint">
              When on, Jarvis passively listens for "Hey Jarvis" and wakes up to take your
              command — no button needed. Uses your mic continuously in the background.
            </p>
            <button
              className={`wake-word-toggle ${voice.wakeWordEnabled ? 'on' : ''}`}
              onClick={voice.toggleWakeWord}
            >
              {voice.wakeWordEnabled ? 'Wake word: ON — say "Hey Jarvis"' : 'Wake word: OFF'}
            </button>
          </section>
        )}

        <section className="settings-section">
          <h3>About</h3>
          <p className="settings-hint">
            Jarvis — a personal AI assistant. Hybrid brain (offline Ollama + cloud
            Groq/Gemini), built entirely on free tools.
          </p>
          {onOpenDebug && (
            <button
              className="wake-word-toggle"
              style={{ marginTop: 10 }}
              onClick={onOpenDebug}
            >
              🔧 Run raw mic diagnostic
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
