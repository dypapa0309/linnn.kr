/**
 * Fallback word library for generating readable slugs when URL parsing yields nothing useful.
 * Words are short, pleasant, and unambiguous in ASCII.
 */
export const FALLBACK_ADJECTIVES = [
  'calm', 'swift', 'neat', 'fresh', 'bold', 'soft', 'clear', 'light',
  'pure', 'warm', 'cool', 'fine', 'true', 'deep', 'rich', 'open',
  'free', 'live', 'real', 'good', 'easy', 'kind', 'fair', 'safe',
  'lean', 'smart', 'quick', 'ready', 'brief', 'clean',
]

export const FALLBACK_NOUNS = [
  'link', 'page', 'note', 'idea', 'post', 'read', 'view', 'spot',
  'card', 'dock', 'gate', 'path', 'step', 'node', 'clip', 'mark',
  'site', 'send', 'look', 'hop', 'jump', 'peek', 'pull', 'push',
  'snap', 'pick', 'lead', 'flow', 'pass', 'seed',
]

export const PRETTY_SUFFIXES = [
  'go', 'now', 'link', 'here', 'page', 'it', 'hub',
]
