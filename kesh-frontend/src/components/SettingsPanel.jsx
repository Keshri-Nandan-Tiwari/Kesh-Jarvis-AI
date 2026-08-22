import { LANGUAGES, THEMES } from '../constants.js'
import { GithubIcon, LinkedinIcon, InstagramIcon, MailIcon } from './Icons.jsx'

const RESPONSE_STYLES = [
  { id: 'fast', label: 'Fast', hint: 'Short, snappy answers' },
  { id: 'balanced', label: 'Balanced', hint: 'Clear, reasonably concise' },
  { id: 'deep', label: 'Deep', hint: 'Thorough, more detail & nuance' },
]

const SOCIAL_LINKS = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/Keshri-Nandan-Tiwari', Icon: GithubIcon },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/keshri-nandan-tiwari-a68042290/', Icon: LinkedinIcon },
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/keshri_08__?igsh=MTk0NXQzbTYwbndyOA==', Icon: InstagramIcon },
  { id: 'email', label: 'Email', href: 'mailto:keshrinandantiwari08@gmail.com', Icon: MailIcon },
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
            <h3>Continuous Conversation</h3>
            <p className="settings-hint">
              When on, Jarvis automatically starts listening again right after it
              finishes speaking — so a back-and-forth conversation only needs one
              tap on the mic to begin.
            </p>
            <button
              className={`wake-word-toggle ${voice.handsFree ? 'on' : ''}`}
              onClick={voice.toggleHandsFree}
            >
              {voice.handsFree ? 'Continuous: ON' : 'Continuous: OFF'}
            </button>
          </section>
        )}

        <section className="settings-section">
          <h3>Connect</h3>
          <p className="settings-hint">Built by Keshri — say hi.</p>
          <div className="social-row">
            {SOCIAL_LINKS.map(({ id, label, href, Icon }) => (
              <a
                key={id}
                className="social-icon-link"
                href={href}
                target={id === 'email' ? undefined : '_blank'}
                rel={id === 'email' ? undefined : 'noopener noreferrer'}
                title={label}
                aria-label={label}
              >
                <Icon size={19} />
              </a>
            ))}
          </div>
        </section>

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
