import { createHash } from 'node:crypto'
import type { PollVote } from './types'

export interface SubmissionDigestInput {
  voterName: string
  votes: PollVote[]
  counterProposal?: string
}

export function createSubmissionDigest(input: SubmissionDigestInput): string {
  const canonicalBallot = [
    'vote-v1',
    input.voterName,
    input.votes.map((vote) => [vote.text, vote.vote, vote.comment]),
    input.counterProposal ?? '',
  ]
  return createHash('sha256').update(JSON.stringify(canonicalBallot), 'utf8').digest('hex')
}
