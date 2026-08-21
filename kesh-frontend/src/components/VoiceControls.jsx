export default function VoiceControls({
  micState,
  supported,
  voices,
  selectedVoiceURI,
  setSelectedVoiceURI,
  handsFree,
  toggleHandsFree,
  onPushToTalk,
  currentLang,
}) {
  if (!supported) {
    return (
      <div className="voice-controls unsupported">
        Voice isn't supported in this browser — try Chrome or Edge.
      </div>
    )
  }

  // Prefer voices matching the selected language; fall back to showing
  // everything if the OS has no voice installed for that language.
  const langPrefix = currentLang?.split('-')[0]
  const matchingVoices = langPrefix
    ? voices.filter((v) => v.lang.startsWith(langPrefix))
    : voices
  const displayVoices = matchingVoices.length > 0 ? matchingVoices : voices

  return (
    <div className="voice-controls">
      <button
        type="button"
        className={`mic-btn ${micState}`}
        onClick={onPushToTalk}
        title={handsFree ? 'Hands-free is on — click to speak anytime' : 'Push to talk'}
      >
        <span className="mic-ring" />
        🎙
      </button>

      <button
        type="button"
        className={`handsfree-toggle ${handsFree ? 'on' : ''}`}
        onClick={toggleHandsFree}
      >
        {handsFree ? 'Hands-free: ON' : 'Hands-free: OFF'}
      </button>

      {displayVoices.length > 0 && (
        <select
          className="voice-select"
          value={selectedVoiceURI || ''}
          onChange={(e) => setSelectedVoiceURI(e.target.value)}
        >
          {displayVoices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
