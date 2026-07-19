import type { PollMode, PollVote, StoredPoll } from './types'
import { isValidResultsToken } from './resultsTokenFormat'

export const VOTER_NAME_MAX = 50
export const COMMENT_MAX = 200
export const COUNTER_PROPOSAL_MAX = 500
export const TITLE_MAX = 100
export const SUGGESTION_MAX = 200
export const MAX_SUGGESTIONS = 3

const POLL_ID_PATTERN = /^[A-Za-z0-9_-]{10}$/
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface ValidationResult {
  valid: boolean
  error?: string
}

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export interface PollInput {
  title: string
  suggestions: string[]
  mode: PollMode
}

export interface VoteInput {
  pollId: string
  submissionId: string
  voterName: string
  votes: PollVote[]
  counterProposal?: string
}

export interface ResultsInput {
  pollId: string
  resultsToken: string
}

function invalid<T>(error: string): ParseResult<T> {
  return { ok: false, error }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isValidPollId(id: unknown): id is string {
  return typeof id === 'string' && POLL_ID_PATTERN.test(id)
}

export function isValidSubmissionId(id: unknown): id is string {
  return typeof id === 'string' && UUID_V4_PATTERN.test(id)
}

export function parsePollInput(body: unknown): ParseResult<PollInput> {
  if (!isRecord(body)) return invalid('Invalid request body')
  const mode = body.mode
  if (mode !== 'normal' && mode !== 'dubious') return invalid('mode must be normal or dubious')

  const suggestions = body.suggestions
  if (!Array.isArray(suggestions) || suggestions.length < 1) {
    return invalid('At least one suggestion required')
  }
  if (suggestions.length > MAX_SUGGESTIONS) {
    return invalid(`At most ${MAX_SUGGESTIONS} suggestions allowed`)
  }

  const normalizedSuggestions: string[] = []
  for (const suggestion of suggestions) {
    if (typeof suggestion !== 'string') return invalid('Each suggestion must be a non-empty string')
    if (suggestion.length > SUGGESTION_MAX) {
      return invalid(`Suggestions must be at most ${SUGGESTION_MAX} characters`)
    }
    const normalized = suggestion.trim()
    if (!normalized) return invalid('Each suggestion must be a non-empty string')
    normalizedSuggestions.push(normalized)
  }
  const uniqueSuggestions = new Set(
    normalizedSuggestions.map((suggestion) => suggestion.toLocaleLowerCase('en-US'))
  )
  if (uniqueSuggestions.size !== normalizedSuggestions.length) {
    return invalid('Suggestions must be unique')
  }

  if (body.title !== undefined && body.title !== null && typeof body.title !== 'string') {
    return invalid('Title must be a string')
  }
  const rawTitle = typeof body.title === 'string' ? body.title : ''
  if (rawTitle.length > TITLE_MAX) return invalid(`Title must be at most ${TITLE_MAX} characters`)
  const title = rawTitle.trim() || (mode === 'dubious' ? 'I Dare You...' : 'What It Do?')

  return { ok: true, data: { title, suggestions: normalizedSuggestions, mode } }
}

export function parseVoteInput(body: unknown, poll: StoredPoll): ParseResult<VoteInput> {
  if (!isRecord(body)) return invalid('Invalid request body')
  if (!isValidPollId(body.pollId)) return invalid('Invalid poll ID')
  if (!isValidSubmissionId(body.submissionId)) return invalid('Invalid submission ID')
  if (!Array.isArray(body.votes) || body.votes.length !== poll.suggestions.length) {
    return invalid('votes must match the poll suggestions exactly')
  }

  const allowed = poll.mode === 'dubious'
    ? new Set(['yes', 'no', 'maybe', 'yolo'])
    : new Set(['yes', 'no', 'maybe'])
  const votes: PollVote[] = []
  for (let index = 0; index < body.votes.length; index++) {
    const rawVote = body.votes[index]
    if (!isRecord(rawVote)) return invalid('Each vote must be an object')
    if (typeof rawVote.text !== 'string' || rawVote.text.trim() !== poll.suggestions[index]) {
      return invalid('Votes must match the poll suggestions in order')
    }
    if (typeof rawVote.vote !== 'string' || !allowed.has(rawVote.vote)) {
      return invalid('Invalid vote value')
    }
    if (rawVote.comment !== undefined && rawVote.comment !== null && typeof rawVote.comment !== 'string') {
      return invalid('Comment must be a string')
    }
    const rawComment = typeof rawVote.comment === 'string' ? rawVote.comment : ''
    if (rawComment.length > COMMENT_MAX) {
      return invalid(`Comment must be at most ${COMMENT_MAX} characters`)
    }
    votes.push({
      text: poll.suggestions[index],
      vote: rawVote.vote as PollVote['vote'],
      comment: rawComment.trim(),
    })
  }

  if (body.voterName !== undefined && body.voterName !== null && typeof body.voterName !== 'string') {
    return invalid('voterName must be a string')
  }
  const rawVoterName = typeof body.voterName === 'string' ? body.voterName : ''
  if (rawVoterName.length > VOTER_NAME_MAX) {
    return invalid(`voterName must be at most ${VOTER_NAME_MAX} characters`)
  }

  if (body.counterProposal !== undefined && body.counterProposal !== null && typeof body.counterProposal !== 'string') {
    return invalid('counterProposal must be a string')
  }
  const rawCounterProposal = typeof body.counterProposal === 'string' ? body.counterProposal : ''
  if (rawCounterProposal.length > COUNTER_PROPOSAL_MAX) {
    return invalid(`counterProposal must be at most ${COUNTER_PROPOSAL_MAX} characters`)
  }

  return {
    ok: true,
    data: {
      pollId: body.pollId,
      submissionId: body.submissionId,
      voterName: rawVoterName.trim() || 'Anonymous',
      votes,
      ...(rawCounterProposal.trim() ? { counterProposal: rawCounterProposal.trim() } : {}),
    },
  }
}

export function parseResultsInput(body: unknown): ParseResult<ResultsInput> {
  if (!isRecord(body)) return invalid('Invalid request body')
  if (!isValidPollId(body.pollId)) return invalid('Invalid poll ID')
  if (!isValidResultsToken(body.resultsToken)) return invalid('Invalid results token')
  return { ok: true, data: { pollId: body.pollId, resultsToken: body.resultsToken } }
}

/** Compatibility wrappers for existing callers while routes adopt typed parse results. */
export function validatePollInput(body: unknown): ValidationResult {
  const result = parsePollInput(body)
  return result.ok ? { valid: true } : { valid: false, error: result.error }
}

export function validateVoteInput(body: unknown, poll: StoredPoll): ValidationResult {
  const result = parseVoteInput(body, poll)
  return result.ok ? { valid: true } : { valid: false, error: result.error }
}
