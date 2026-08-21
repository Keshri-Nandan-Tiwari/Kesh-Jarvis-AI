export default function MessageBubble({ role, content, brainUsed }) {
  const isUser = role === 'user'
  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`bubble ${brainUsed === 'debug' ? 'debug-bubble' : ''}`}>
        <p>{content}</p>
        {!isUser && brainUsed && (
          <span className={`brain-tag ${brainUsed}`}>
            {brainUsed === 'offline' ? '⚡ offline' : brainUsed === 'debug' ? '⚠ voice diagnostic' : '☁ cloud'}
          </span>
        )}
      </div>
    </div>
  )
}
