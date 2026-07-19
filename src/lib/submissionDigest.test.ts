import { describe, expect, it } from 'vitest'
import { createSubmissionDigest } from './submissionDigest'

const ballot = {
  voterName: 'Alice',
  votes: [
    { text: 'Pizza', vote: 'yes' as const, comment: 'Extra cheese' },
    { text: 'Tacos', vote: 'maybe' as const, comment: '' },
  ],
  counterProposal: 'Both',
}

describe('createSubmissionDigest', () => {
  it('creates a stable SHA-256 digest from the canonical vote-v1 tuple', () => {
    expect(createSubmissionDigest(ballot)).toBe(
      '2ae95fed52b476e12d2806bb8ce118e974dd7e6a12c64fff11968f86c526b3c1'
    )
  })

  it('treats an omitted counterproposal as the canonical empty string', () => {
    const withoutCounter = { voterName: ballot.voterName, votes: ballot.votes }
    expect(createSubmissionDigest(withoutCounter)).toBe(
      createSubmissionDigest({ ...withoutCounter, counterProposal: '' })
    )
  })

  it.each([
    { ...ballot, voterName: 'Bob' },
    { ...ballot, votes: [{ ...ballot.votes[0], vote: 'no' as const }, ballot.votes[1]] },
    { ...ballot, votes: [{ ...ballot.votes[0], comment: 'No cheese' }, ballot.votes[1]] },
    { ...ballot, votes: [...ballot.votes].reverse() },
    { ...ballot, counterProposal: 'Neither' },
  ])('changes when a normalized ballot field changes', (changed) => {
    expect(createSubmissionDigest(changed)).not.toBe(createSubmissionDigest(ballot))
  })
})
