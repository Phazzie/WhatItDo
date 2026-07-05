import type { Poll } from './types'

export const VOTER_NAME_MAX = 50
export const COMMENT_MAX = 200
export const COUNTER_PROPOSAL_MAX = 500
export const TITLE_MAX = 100
export const SUGGESTION_MAX = 200
export const MAX_SUGGESTIONS = 3

export interface ValidationResult {
  valid: boolean
  error?: string
}

const ok: ValidationResult = { valid: true }

function fail(error: string): ValidationResult {
  return { valid: false, error }
}

/** Validates the body of `POST /api/poll`. */
export function validatePollInput(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return fail('Invalid request body')
  }

  const { title, suggestions } = body as { title?: unknown; suggestions?: unknown }

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    return fail('At least one suggestion required')
  }

  if (suggestions.length > MAX_SUGGESTIONS) {
    return fail(`At most ${MAX_SUGGESTIONS} suggestions allowed`)
  }

  for (const suggestion of suggestions) {
    if (typeof suggestion !== 'string' || suggestion.trim().length === 0) {
      return fail('Each suggestion must be a non-empty string')
    }
    if (suggestion.length > SUGGESTION_MAX) {
      return fail(`Suggestions must be at most ${SUGGESTION_MAX} characters`)
    }
  }

  if (title !== undefined && title !== null) {
    if (typeof title !== 'string') {
      return fail('Title must be a string')
    }
    if (title.length > TITLE_MAX) {
      return fail(`Title must be at most ${TITLE_MAX} characters`)
    }
  }

  return ok
}

/** Validates the body of `POST /api/vote` against the poll it targets. */
export function validateVoteInput(body: unknown, poll: Poll): ValidationResult {
  if (!body || typeof body !== 'object') {
    return fail('Invalid request body')
  }

  const { voterName, votes, counterProposal } = body as {
    voterName?: unknown
    votes?: unknown
    counterProposal?: unknown
  }

  if (!Array.isArray(votes) || votes.length === 0) {
    return fail('votes must be a non-empty array')
  }

  const allowedVotes: string[] =
    poll.mode === 'dubious' ? ['yes', 'no', 'maybe', 'yolo'] : ['yes', 'no', 'maybe']

  if (votes.length !== poll.suggestions.length) {
    return fail('votes must match the poll suggestions exactly')
  }

  // Positional matching: votes[i] must target poll.suggestions[i]. The
  // results page aggregates by index, so membership checks alone would let
  // reordered payloads miscount votes, and duplicate suggestion texts would
  // wrongly reject legitimate submissions.
  for (let i = 0; i < votes.length; i++) {
    const vote = votes[i]
    if (!vote || typeof vote !== 'object') {
      return fail('Each vote must be an object')
    }

    const { text, vote: voteValue, comment } = vote as {
      text?: unknown
      vote?: unknown
      comment?: unknown
    }

    if (typeof text !== 'string' || text !== poll.suggestions[i]) {
      return fail('Votes must match the poll suggestions in order')
    }

    if (typeof voteValue !== 'string' || !allowedVotes.includes(voteValue)) {
      return fail('Invalid vote value')
    }

    if (comment !== undefined && comment !== null) {
      if (typeof comment !== 'string' || comment.length > COMMENT_MAX) {
        return fail(`Comment must be at most ${COMMENT_MAX} characters`)
      }
    }
  }

  if (voterName !== undefined && voterName !== null) {
    if (typeof voterName !== 'string' || voterName.length > VOTER_NAME_MAX) {
      return fail(`voterName must be a string of at most ${VOTER_NAME_MAX} characters`)
    }
  }

  if (counterProposal !== undefined && counterProposal !== null) {
    if (typeof counterProposal !== 'string' || counterProposal.length > COUNTER_PROPOSAL_MAX) {
      return fail(`counterProposal must be at most ${COUNTER_PROPOSAL_MAX} characters`)
    }
  }

  return ok
}
