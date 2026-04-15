// Shared utility functions used across multiple pages

export type VoteOption = 'yes' | 'no' | 'maybe' | 'yolo'

export function getVoteEmoji(vote: string): string {
  if (vote === 'yes') return '✅'
  if (vote === 'no') return '❌'
  if (vote === 'maybe') return '🤔'
  if (vote === 'yolo') return '🎲'
  return ''
}

export function getVoteColor(vote: string): string {
  if (vote === 'yes') return 'text-green-400'
  if (vote === 'no') return 'text-red-400'
  if (vote === 'maybe') return 'text-yellow-400'
  if (vote === 'yolo') return 'text-violet-400'
  return ''
}

/**
 * Escape HTML entities to prevent injection in email templates.
 * Only needed for string-concatenated HTML (not React JSX).
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
