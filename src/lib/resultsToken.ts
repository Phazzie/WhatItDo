import { createHash, timingSafeEqual } from 'node:crypto'
import { nanoid } from 'nanoid'
import { RESULTS_TOKEN_LENGTH } from './resultsTokenFormat'

export { RESULTS_TOKEN_LENGTH, isValidResultsToken } from './resultsTokenFormat'
const HASH_PATTERN = /^[a-f0-9]{64}$/

export function createResultsToken(): string {
  return nanoid(RESULTS_TOKEN_LENGTH)
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
