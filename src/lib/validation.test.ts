import { describe, expect, it } from 'vitest'
import { validatePollInput, validateVoteInput } from './validation'
import type { Poll } from './types'

describe('validatePollInput', () => {
  it('accepts 1-3 non-empty suggestions and a short title', () => {
    const result = validatePollInput({ title: 'Dinner', suggestions: ['Pizza', 'Tacos'] })
    expect(result.valid).toBe(true)
  })

  it('rejects more than 3 suggestions', () => {
    const result = validatePollInput({ suggestions: Array.from({ length: 50 }, (_, i) => `Option ${i}`) })
    expect(result.valid).toBe(false)
  })

  it('rejects zero suggestions', () => {
    const result = validatePollInput({ suggestions: [] })
    expect(result.valid).toBe(false)
  })

  it('rejects a suggestion over 200 chars', () => {
    const result = validatePollInput({ suggestions: ['a'.repeat(201)] })
    expect(result.valid).toBe(false)
  })

  it('rejects an empty-string suggestion', () => {
    const result = validatePollInput({ suggestions: ['   '] })
    expect(result.valid).toBe(false)
  })

  it('rejects a non-string suggestion', () => {
    const result = validatePollInput({ suggestions: [42] })
    expect(result.valid).toBe(false)
  })

  it('rejects a title over 100 chars', () => {
    const result = validatePollInput({ title: 'a'.repeat(101), suggestions: ['Pizza'] })
    expect(result.valid).toBe(false)
  })
})

describe('validateVoteInput', () => {
  const normalPoll: Poll = {
    id: 'p1',
    title: 'What It Do?',
    suggestions: ['Pizza', 'Tacos'],
    creatorEmail: 'creator@example.com',
    createdAt: Date.now(),
    responses: [],
    mode: 'normal',
  }

  const dubiousPoll: Poll = { ...normalPoll, mode: 'dubious' }

  it('accepts votes matching the poll suggestions exactly', () => {
    const result = validateVoteInput(
      { votes: [{ text: 'Pizza', vote: 'yes' }, { text: 'Tacos', vote: 'no' }] },
      normalPoll
    )
    expect(result.valid).toBe(true)
  })

  it('rejects a non-string vote value (would otherwise throw on toUpperCase())', () => {
    const result = validateVoteInput(
      { votes: [{ text: 'Pizza', vote: 123 }, { text: 'Tacos', vote: 'no' }] },
      normalPoll
    )
    expect(result.valid).toBe(false)
  })

  it('rejects yolo votes on a normal-mode poll', () => {
    const result = validateVoteInput(
      { votes: [{ text: 'Pizza', vote: 'yolo' }, { text: 'Tacos', vote: 'no' }] },
      normalPoll
    )
    expect(result.valid).toBe(false)
  })

  it('accepts yolo votes on a dubious-mode poll', () => {
    const result = validateVoteInput(
      { votes: [{ text: 'Pizza', vote: 'yolo' }, { text: 'Tacos', vote: 'no' }] },
      dubiousPoll
    )
    expect(result.valid).toBe(true)
  })

  it('rejects a vote text that does not match any poll suggestion', () => {
    const result = validateVoteInput(
      { votes: [{ text: 'Sushi', vote: 'yes' }, { text: 'Tacos', vote: 'no' }] },
      normalPoll
    )
    expect(result.valid).toBe(false)
  })

  it('rejects when votes do not cover every suggestion', () => {
    const result = validateVoteInput({ votes: [{ text: 'Pizza', vote: 'yes' }] }, normalPoll)
    expect(result.valid).toBe(false)
  })

  it('rejects a voterName over 50 chars', () => {
    const result = validateVoteInput(
      {
        voterName: 'a'.repeat(51),
        votes: [{ text: 'Pizza', vote: 'yes' }, { text: 'Tacos', vote: 'no' }],
      },
      normalPoll
    )
    expect(result.valid).toBe(false)
  })

  it('rejects a comment over 200 chars', () => {
    const result = validateVoteInput(
      {
        votes: [
          { text: 'Pizza', vote: 'yes', comment: 'a'.repeat(201) },
          { text: 'Tacos', vote: 'no' },
        ],
      },
      normalPoll
    )
    expect(result.valid).toBe(false)
  })

  it('rejects a counterProposal over 500 chars', () => {
    const result = validateVoteInput(
      {
        counterProposal: 'a'.repeat(501),
        votes: [{ text: 'Pizza', vote: 'yes' }, { text: 'Tacos', vote: 'no' }],
      },
      normalPoll
    )
    expect(result.valid).toBe(false)
  })
})

describe('vote validation is positional (Codex review)', () => {
  const basePoll = {
    id: 'p1', title: 't', creatorEmail: '', createdAt: 0, responses: [], mode: 'normal' as const,
  }

  it('rejects votes submitted in a different order than the suggestions', () => {
    const poll = { ...basePoll, suggestions: ['Pizza', 'Tacos'] }
    const result = validateVoteInput({
      pollId: 'p1',
      votes: [
        { text: 'Tacos', vote: 'yes', comment: '' },
        { text: 'Pizza', vote: 'no', comment: '' },
      ],
    }, poll)
    expect(result.valid).toBe(false)
  })

  it('accepts votes on a poll with duplicate suggestion texts', () => {
    const poll = { ...basePoll, suggestions: ['A', 'A'] }
    const result = validateVoteInput({
      pollId: 'p1',
      votes: [
        { text: 'A', vote: 'yes', comment: '' },
        { text: 'A', vote: 'no', comment: '' },
      ],
    }, poll)
    expect(result.valid).toBe(true)
  })
})
