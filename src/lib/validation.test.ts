import { describe, expect, it } from 'vitest'
import type { StoredPoll } from './types'
import {
  COMMENT_MAX,
  COUNTER_PROPOSAL_MAX,
  MAX_SUGGESTIONS,
  SUGGESTION_MAX,
  TITLE_MAX,
  VOTER_NAME_MAX,
  isValidPollId,
  isValidSubmissionId,
  parsePollInput,
  parseResultsInput,
  parseVoteInput,
} from './validation'

const poll: StoredPoll = {
  id: 'poll123456',
  title: 'Dinner?',
  suggestions: ['Pizza', 'Tacos'],
  mode: 'normal',
  createdAt: 1_800_000_000_000,
  expiresAt: 1_800_000_001_000,
  resultsTokenHash: 'a'.repeat(64),
}

const validVote = {
  pollId: poll.id,
  submissionId: '550e8400-e29b-41d4-a716-446655440000',
  voterName: ' Alice ',
  votes: [
    { text: 'Pizza', vote: 'yes', comment: ' yum ' },
    { text: 'Tacos', vote: 'maybe' },
  ],
  counterProposal: ' Sushi ',
}

describe('identifier validation', () => {
  it.each(['abcdefghij', 'A0_-bcdefg'])('accepts an exact poll id: %s', (id) => {
    expect(isValidPollId(id)).toBe(true)
  })

  it.each(['abcdefghi', 'abcdefghijk', 'bad:id0000', '', 42])('rejects malformed poll ids: %s', (id) => {
    expect(isValidPollId(id)).toBe(false)
  })

  it('accepts only UUIDv4 submission ids', () => {
    expect(isValidSubmissionId(validVote.submissionId)).toBe(true)
    expect(isValidSubmissionId('550e8400-e29b-11d4-a716-446655440000')).toBe(false)
    expect(isValidSubmissionId('550e8400-e29b-41d4-7716-446655440000')).toBe(false)
  })
})

describe('parsePollInput', () => {
  it('normalizes whitespace and supplies mode-specific default titles', () => {
    expect(parsePollInput({ title: '  ', suggestions: [' Pizza '], mode: 'normal' })).toEqual({
      ok: true,
      data: { title: 'What It Do?', suggestions: ['Pizza'], mode: 'normal' },
    })
    expect(parsePollInput({ suggestions: [' Dare '], mode: 'dubious' })).toMatchObject({
      ok: true,
      data: { title: 'I Dare You...', suggestions: ['Dare'], mode: 'dubious' },
    })
  })

  it('accepts the exact numeric boundaries', () => {
    expect(parsePollInput({
      title: 't'.repeat(TITLE_MAX),
      suggestions: Array.from(
        { length: MAX_SUGGESTIONS },
        (_, index) => `${'s'.repeat(SUGGESTION_MAX - 1)}${index}`
      ),
      mode: 'normal',
    }).ok).toBe(true)
  })

  it.each([
    [{ mode: 'normal', suggestions: [] }, 'At least one'],
    [{ mode: 'normal', suggestions: ['a', 'b', 'c', 'd'] }, 'At most'],
    [{ mode: 'normal', suggestions: ['x'.repeat(SUGGESTION_MAX + 1)] }, 'Suggestions'],
    [{ mode: 'normal', suggestions: ['  '] }, 'non-empty'],
    [{ mode: 'normal', suggestions: [1] }, 'non-empty'],
    [{ mode: 'normal', suggestions: [' Pizza ', 'pizza'] }, 'unique'],
    [{ mode: 'normal', suggestions: ['a'], title: 'x'.repeat(TITLE_MAX + 1) }, 'Title'],
    [{ mode: 'chaos', suggestions: ['a'] }, 'mode'],
  ])('rejects invalid numeric/type cases', (body, message) => {
    expect(parsePollInput(body)).toMatchObject({ ok: false, error: expect.stringContaining(message) })
  })
})

describe('parseVoteInput', () => {
  it('normalizes only approved fields and preserves positional meaning', () => {
    expect(parseVoteInput({ ...validVote, extra: 'discard me' }, poll)).toEqual({
      ok: true,
      data: {
        pollId: poll.id,
        submissionId: validVote.submissionId,
        voterName: 'Alice',
        votes: [
          { text: 'Pizza', vote: 'yes', comment: 'yum' },
          { text: 'Tacos', vote: 'maybe', comment: '' },
        ],
        counterProposal: 'Sushi',
      },
    })
  })

  it('uses Anonymous and drops a blank counterproposal', () => {
    const result = parseVoteInput({ ...validVote, voterName: ' ', counterProposal: ' ' }, poll)
    expect(result).toMatchObject({ ok: true, data: { voterName: 'Anonymous' } })
    if (result.ok) expect(result.data).not.toHaveProperty('counterProposal')
  })

  it('accepts exact text limits', () => {
    expect(parseVoteInput({
      ...validVote,
      voterName: 'n'.repeat(VOTER_NAME_MAX),
      counterProposal: 'c'.repeat(COUNTER_PROPOSAL_MAX),
      votes: [
        { text: 'Pizza', vote: 'yes', comment: 'x'.repeat(COMMENT_MAX) },
        { text: 'Tacos', vote: 'no' },
      ],
    }, poll).ok).toBe(true)
  })

  it.each([
    [{ ...validVote, submissionId: 'not-a-uuid' }, 'submission'],
    [{ ...validVote, voterName: 'x'.repeat(VOTER_NAME_MAX + 1) }, 'voterName'],
    [{ ...validVote, counterProposal: 'x'.repeat(COUNTER_PROPOSAL_MAX + 1) }, 'counterProposal'],
    [{ ...validVote, votes: [{ text: 'Tacos', vote: 'yes' }, { text: 'Pizza', vote: 'no' }] }, 'order'],
    [{ ...validVote, votes: [{ text: 'Pizza', vote: 'yolo' }, { text: 'Tacos', vote: 'no' }] }, 'vote value'],
    [{ ...validVote, votes: [{ text: 'Pizza', vote: 'yes', comment: 'x'.repeat(COMMENT_MAX + 1) }, { text: 'Tacos', vote: 'no' }] }, 'Comment'],
  ])('rejects invalid vote contracts', (body, message) => {
    expect(parseVoteInput(body, poll)).toMatchObject({ ok: false, error: expect.stringContaining(message) })
  })

  it('accepts yolo only in dubious mode', () => {
    const body = { ...validVote, votes: [{ text: 'Pizza', vote: 'yolo' }, { text: 'Tacos', vote: 'no' }] }
    expect(parseVoteInput(body, poll).ok).toBe(false)
    expect(parseVoteInput(body, { ...poll, mode: 'dubious' }).ok).toBe(true)
  })
})

describe('parseResultsInput', () => {
  it('requires an exact poll id and token', () => {
    const token = 'A_-bcdefghijklmnopqrstuv'
    expect(parseResultsInput({ pollId: poll.id, resultsToken: token })).toMatchObject({ ok: true })
    expect(parseResultsInput({ pollId: 'short', resultsToken: token })).toMatchObject({ ok: false })
    expect(parseResultsInput({ pollId: poll.id, resultsToken: 'too-short' })).toMatchObject({ ok: false })
  })
})
