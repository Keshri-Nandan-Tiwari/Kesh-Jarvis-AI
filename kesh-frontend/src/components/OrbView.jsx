import { MicIcon } from './Icons.jsx'
import KeshOrb from './KeshOrb.jsx'

const STATUS_LABEL = {
  idle: 'Ready',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking…',
}

export default function OrbView({ orbState, voice, onExit, onPushToTalk, onOpenSettings, lastUserMessage, lastAssistantMessage }) {
  const showExchange = orbState !== 'listening' && (lastUserMessage || lastAssistantMessage)

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

      <div className="orb-controls">
        <button
          className={`orb-mic-btn ${voice.micState}`}
          onClick={onPushToTalk}
          title="Push to talk"
        >
          <MicIcon size={24} />
        </button>
        <button
          className={`handsfree-toggle ${voice.handsFree ? 'on' : ''}`}
          onClick={voice.toggleHandsFree}
          title="Keep listening automatically after each reply"
        >
          {voice.handsFree ? '🔁 Continuous: ON' : '🔁 Continuous: OFF'}
        </button>
      </div>
    </div>
  )
}
