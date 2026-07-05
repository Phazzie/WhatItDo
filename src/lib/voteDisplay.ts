export function getVoteEmoji(vote: string | null | undefined) {
  if (vote === 'yes') return '✅'
  if (vote === 'no') return '❌'
  if (vote === 'maybe') return '🤔'
  if (vote === 'yolo') return '🎲'
  return ''
}

export function getVoteColor(vote: string | null | undefined) {
  if (vote === 'yes') return 'text-green-400'
  if (vote === 'no') return 'text-red-400'
  if (vote === 'maybe') return 'text-yellow-400'
  if (vote === 'yolo') return 'text-violet-400'
  return ''
}

export function getVoteBgColor(vote: string | null | undefined) {
  if (vote === 'yes') return 'bg-green-500'
  if (vote === 'no') return 'bg-red-500'
  if (vote === 'maybe') return 'bg-yellow-500'
  if (vote === 'yolo') return 'bg-gradient-to-r from-violet-500 to-rose-500'
  return 'bg-gray-500'
}
