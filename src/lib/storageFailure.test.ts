import { describe, expect, it } from 'vitest'
import { StorageConfigurationError, describeStorageFailure } from './storageFailure'

describe('describeStorageFailure', () => {
  it('reports an application configuration message in full', () => {
    const error = new StorageConfigurationError('Redis is not configured. Missing UPSTASH_REDIS_REST_URL.')
    expect(describeStorageFailure(error)).toBe(
      'configuration: Redis is not configured. Missing UPSTASH_REDIS_REST_URL.'
    )
  })

  it('names a dead host without quoting the provider message', () => {
    const error = Object.assign(new Error('getaddrinfo ENOTFOUND secret-db.upstash.io'), {
      code: 'ENOTFOUND',
      syscall: 'getaddrinfo',
    })
    const described = describeStorageFailure(error)
    expect(described).toBe('name=Error code=ENOTFOUND syscall=getaddrinfo')
    expect(described).not.toContain('secret-db.upstash.io')
  })

  it('unwraps the cause chain that node-redis wraps around a socket error', () => {
    const cause = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED', errno: -111 })
    const error = Object.assign(new Error('Socket closed unexpectedly'), { cause })
    expect(describeStorageFailure(error)).toBe('name=Error code=ECONNREFUSED errno=-111')
  })

  it('never emits a ballot carried in a provider message', () => {
    const error = new Error('EVAL failed: ARGV[3]={"voterName":"Alice","comment":"SENTINEL_PRIVATE_BALLOT"}')
    const described = describeStorageFailure(error)
    expect(described).toBe('name=Error')
    expect(described).not.toContain('SENTINEL_PRIVATE_BALLOT')
    expect(described).not.toContain('Alice')
  })

  it('never emits a password embedded in a connection string', () => {
    const error = Object.assign(new Error('rediss://default:hunter2@db.example.com:6379 refused'), {
      code: 'ECONNREFUSED',
    })
    expect(describeStorageFailure(error)).not.toContain('hunter2')
  })

  it('rejects a non-code-shaped field rather than passing payload through', () => {
    const error = Object.assign(new Error('boom'), {
      code: 'voter Alice said SENTINEL_PRIVATE_BALLOT',
    })
    const described = describeStorageFailure(error)
    expect(described).toBe('name=Error')
    expect(described).not.toContain('SENTINEL_PRIVATE_BALLOT')
  })

  it('keeps an integer errno but drops a number that is not code-shaped', () => {
    const integerErrno = Object.assign(new Error('boom'), { code: 'ECONNRESET', errno: -3008 })
    expect(describeStorageFailure(integerErrno)).toBe('name=Error code=ECONNRESET errno=-3008')

    // String(1e21) is '1e+21'; `+` is outside the allow-listed charset.
    const exponentialErrno = Object.assign(new Error('boom'), { code: 'ECONNRESET', errno: 1e21 })
    const described = describeStorageFailure(exponentialErrno)
    expect(described).toBe('name=Error code=ECONNRESET')
    expect(described).not.toContain('+')
  })

  it('drops a non-finite numeric field', () => {
    const error = Object.assign(new Error('boom'), { errno: Number.NaN })
    expect(describeStorageFailure(error)).toBe('name=Error')
  })

  it('terminates on a self-referencing cause chain', () => {
    const error = new Error('loop') as Error & { cause?: unknown }
    error.cause = error
    expect(describeStorageFailure(error)).toBe('name=Error')
  })

  it('falls back to a stable label for a non-object failure', () => {
    expect(describeStorageFailure('boom')).toBe('unavailable')
    expect(describeStorageFailure(null)).toBe('unavailable')
    expect(describeStorageFailure(undefined)).toBe('unavailable')
  })
})
