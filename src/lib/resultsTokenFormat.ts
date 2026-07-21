export const RESULTS_TOKEN_LENGTH = 24

const TOKEN_PATTERN = new RegExp(`^[A-Za-z0-9_-]{${RESULTS_TOKEN_LENGTH}}$`)

export function isValidResultsToken(token: unknown): token is string {
  return typeof token === 'string' && TOKEN_PATTERN.test(token)
}
