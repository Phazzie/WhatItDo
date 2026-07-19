import { describe, expect, it } from 'vitest'
import { RESULTS_TOKEN_LENGTH, createResultsToken, hashResultsToken, isValidResultsToken, verifyResultsToken } from './resultsToken'

describe('private results tokens', () => {
  it('creates exact-length tokens and stores deterministic SHA-256 hashes', () => {
    const token = createResultsToken()
    expect(token).toHaveLength(RESULTS_TOKEN_LENGTH)
    expect(isValidResultsToken(token)).toBe(true)
    expect(hashResultsToken(token)).toMatch(/^[a-f0-9]{64}$/)
    expect(hashResultsToken(token)).not.toContain(token)
  })

  it('verifies the right token and safely rejects wrong or malformed hashes', () => {
    const token = 'A_-bcdefghijklmnopqrstuv'
    const hash = hashResultsToken(token)
    expect(verifyResultsToken(token, hash)).toBe(true)
    expect(verifyResultsToken('Z_-bcdefghijklmnopqrstuv', hash)).toBe(false)
    expect(verifyResultsToken(token, 'not-a-hash')).toBe(false)
    expect(verifyResultsToken(token, 'a'.repeat(62))).toBe(false)
  })

  it.each(['short', 'a'.repeat(23), 'a'.repeat(25), 'a'.repeat(23) + '!'])('rejects malformed tokens', (token) => {
    expect(isValidResultsToken(token)).toBe(false)
  })
})
