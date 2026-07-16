import type { PollResponse, VoteOption } from './types'

export const VOTE_ORDER: VoteOption[] = ['yes', 'maybe', 'no', 'yolo']
export const VOTE_LABEL: Record<VoteOption, string> = {
  yes: 'YES',
  maybe: 'MAYBE',
  no: 'NOPE',
  yolo: 'YOLO',
}

export type VoteCounts = Record<VoteOption, number>

export function availableVotes(dubious: boolean): VoteOption[] {
  return VOTE_ORDER.filter((vote) => dubious || vote !== 'yolo')
}

export function countVotes(responses: PollResponse[], suggestionIndex: number): VoteCounts {
  const counts: VoteCounts = { yes: 0, maybe: 0, no: 0, yolo: 0 }
  for (const response of responses) {
    const vote = response.votes[suggestionIndex]?.vote
    if (vote && Object.hasOwn(counts, vote)) counts[vote] += 1
  }
  return counts
}

export function summarizeVotes(counts: VoteCounts, dubious: boolean) {
  const choices = availableVotes(dubious)
  const total = choices.reduce((sum, vote) => sum + counts[vote], 0)
  const percentages = Object.fromEntries(
    VOTE_ORDER.map((vote) => [vote, total === 0 ? 0 : (counts[vote] / total) * 100])
  ) as Record<VoteOption, number>
  const high = Math.max(...choices.map((vote) => counts[vote]))
  const leaders = high === 0 ? [] : choices.filter((vote) => counts[vote] === high)
  const verdict = leaders.length === 0
    ? 'Awaiting evidence'
    : leaders.length > 1
      ? `Tie: ${leaders.map((vote) => VOTE_LABEL[vote]).join(' + ')}`
      : `${VOTE_LABEL[leaders[0]]} leads`

  return { choices, total, percentages, leaders, verdict }
}
