export default function Sidebar({ sessions, activeSessionId, onSelectSession, onNewChat, backendOnline, onOpenOrb, onOpenSettings, mobileOpen, user, onLogout }) {
  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="jarvis-wordmark sidebar-wordmark">
          <span className="jarvis-wordmark-ring" />
          <span className="jarvis-wordmark-text">JARVIS</span>
        </div>
        <button className="new-chat-btn" onClick={onNewChat}>+ New Chat</button>
        <button className="enter-orb-btn" onClick={onOpenOrb}>
          <span className="voice-mode-icon" /> Talk to Jarvis
        </button>
      </div>

      <div className="session-list">
        {sessions.length === 0 && (
          <p className="empty-hint">No conversations yet — say hi.</p>
        )}
        {sessions.map((s) => (
          <button
            key={s.id}
            className={`session-item ${s.id === activeSessionId ? 'active' : ''}`}
            onClick={() => onSelectSession(s.id)}
            title={s.title}
          >
            {s.title || 'New Chat'}
          </button>
        ))}
      </div>

      {user && (
        <div className="profile-section">
          <div className="profile-avatar">{user.username?.[0]?.toUpperCase() || '?'}</div>
          <div className="profile-info">
            <span className="profile-name">{user.username}</span>
            <span className="profile-email">{user.email}</span>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Log out">⏻</button>
        </div>
      )}

      <div className="sidebar-footer">
        <span className={`status-dot ${backendOnline ? 'online' : 'offline'}`} />
        <span className="footer-status-text">
          {backendOnline ? 'Backend connected' : 'Backend unreachable'}
        </span>
        <button className="settings-gear" onClick={onOpenSettings} title="Settings">⚙</button>
      </div>
    </aside>
  )
}
