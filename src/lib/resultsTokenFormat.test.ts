import { describe, expect, it } from 'vitest'
import { RESULTS_TOKEN_LENGTH, isValidResultsToken } from './resultsTokenFormat'

describe('browser-safe results token format', () => {
  it('accepts exactly the Nano ID alphabet and exported length', () => {
    const token = `A_-b${'c'.repeat(RESULTS_TOKEN_LENGTH - 4)}`
    expect(token).toHaveLength(RESULTS_TOKEN_LENGTH)
    expect(isValidResultsToken(token)).toBe(true)
  })

  it.each([
    null,
    undefined,
    24,
    'a'.repeat(RESULTS_TOKEN_LENGTH - 1),
    'a'.repeat(RESULTS_TOKEN_LENGTH + 1),
  ])('rejects non-string and wrong-length value %j', (token) => {
    expect(isValidResultsToken(token)).toBe(false)
  })

  it.each([' ', '!', '.', '/', 'é'])('rejects non-Nano-ID character %j', (character) => {
    const token = `${'a'.repeat(RESULTS_TOKEN_LENGTH - 1)}${character}`
    expect(isValidResultsToken(token)).toBe(false)
  })
})
