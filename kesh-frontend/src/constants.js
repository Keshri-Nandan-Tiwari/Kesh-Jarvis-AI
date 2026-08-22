// BCP-47 codes recognized by both the browser's SpeechRecognition and
// SpeechSynthesis APIs. Actual available voices per language depend on
// what's installed on the user's OS/browser.
export const LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)' },
  { code: 'ar-SA', label: 'Arabic' },
]

export const THEMES = [
  { id: 'amber', label: 'Amber (JARVIS)' },
  { id: 'crimson', label: 'Crimson (Dark Red)' },
  { id: 'violet', label: 'Violet' },
  { id: 'sapphire', label: 'Sapphire (Dark Blue)' },
  { id: 'obsidian', label: 'Obsidian (Dark Black)' },
  { id: 'light', label: 'Light' },
]
