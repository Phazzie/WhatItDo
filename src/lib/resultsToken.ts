import { createHash, timingSafeEqual } from 'node:crypto'
import { nanoid } from 'nanoid'

export const RESULTS_TOKEN_LENGTH = 24
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{24}$/
const HASH_PATTERN = /^[a-f0-9]{64}$/

export function createResultsToken(): string {
  return nanoid(RESULTS_TOKEN_LENGTH)
}

export function isValidResultsToken(token: unknown): token is string {
  return typeof token === 'string' && TOKEN_PATTERN.test(token)
}

export function hashResultsToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function verifyResultsToken(token: string, expectedHash: string): boolean {
  const actual = createHash('sha256').update(token, 'utf8').digest()
  const validExpected = HASH_PATTERN.test(expectedHash)
  const expected = validExpected ? Buffer.from(expectedHash, 'hex') : Buffer.alloc(actual.length)
  return timingSafeEqual(actual, expected) && validExpected
}
