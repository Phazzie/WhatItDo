/**
 * Storage failures must stay diagnosable without leaking a ballot or a credential.
 *
 * An Upstash error message can quote the whole EVAL command, whose ARGV carries a
 * private ballot, and a protocol connection error can echo the password embedded in
 * `REDIS_URL`. A provider's free-form message is therefore never logged. Only the
 * allow-listed structured fields below are, which is enough to separate a missing
 * configuration from a dead host from a refused connection.
 */

/**
 * A configuration fault raised by this application rather than by a provider. The
 * message is author-written and holds no credential, so it is safe to log in full.
 */
export class StorageConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageConfigurationError'
  }
}

/** Non-secret fields, in log order. `message` is deliberately absent. */
const DESCRIBED_FIELDS = ['name', 'code', 'errno', 'syscall'] as const

/** Node system codes look like `ENOTFOUND`; anything else is treated as payload. */
const SAFE_VALUE_PATTERN = /^[A-Za-z0-9_.-]{1,64}$/

const MAX_CAUSE_DEPTH = 5

function safeValue(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value !== 'string') return null
  return SAFE_VALUE_PATTERN.test(value) ? value : null
}

/**
 * Reduce an unknown storage failure to a short, leak-free descriptor such as
 * `name=Error code=ENOTFOUND syscall=getaddrinfo`. Walks the `cause` chain because
 * node-redis wraps the underlying socket error that actually names the fault.
 */
export function describeStorageFailure(error: unknown): string {
  if (error instanceof StorageConfigurationError) return `configuration: ${error.message}`

  const found = new Map<string, string>()
  const seen = new Set<object>()
  let current: unknown = error

  for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth += 1) {
    if (current === null || typeof current !== 'object' || seen.has(current)) break
    seen.add(current)
    const record = current as Record<string, unknown>
    for (const field of DESCRIBED_FIELDS) {
      if (found.has(field)) continue
      const value = safeValue(record[field])
      if (value !== null) found.set(field, value)
    }
    current = record.cause
  }

  const parts = DESCRIBED_FIELDS.flatMap((field) => {
    const value = found.get(field)
    return value === undefined ? [] : [`${field}=${value}`]
  })
  return parts.length > 0 ? parts.join(' ') : 'unavailable'
}
