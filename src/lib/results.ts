import type { PollResponse, VoteOption } from './types'

export const VOTE_ORDER: VoteOption[] = ['yes', 'maybe', 'no', 'yolo']
export const VOTE_LABEL: Record<VoteOption, string> = {
  yes: 'YEA',
  maybe: 'PRESENT',
  no: 'NAY',
  yolo: 'HELL YEA',
}

// Parliamentary phrasing for a single plurality leader. Ties never use these.
const LEADER_VERDICT: Record<VoteOption, string> = {
  yes: 'The yeas have it',
  maybe: 'Present leads. The chat shrugs',
  no: 'The nays have it',
  yolo: 'The HELL YEAS have it',
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
    ? 'Awaiting the roll'
    : leaders.length > 1
      ? `Tied: ${leaders.map((vote) => VOTE_LABEL[vote]).join(' + ')}`
      : LEADER_VERDICT[leaders[0]]

  return { choices, total, percentages, leaders, verdict }
}
