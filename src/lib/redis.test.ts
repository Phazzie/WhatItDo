import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { inMemoryRedis } from './inMemoryRedis'
import {
  MAX_POLL_RESPONSES,
  POLL_ABSOLUTE_TTL_SECONDS,
  POLL_IDLE_TTL_SECONDS,
  appendVoteAtomically,
  checkPollCreateRateLimit,
  getRedis,
  isInMemoryRedisAllowed,
  resetRedisForTests,
  resolveClientIp,
} from './redis'

const now = 1_800_000_000_000

async function seedPoll(id = 'poll123456', createdAt = now, expiresAt?: number) {
  await inMemoryRedis.set(
    `poll:${id}`,
    JSON.stringify({ id, createdAt, ...(expiresAt === undefined ? {} : { expiresAt }) }),
    { ex: POLL_IDLE_TTL_SECONDS }
  )
}

function append(id: string, submissionId: string, clientIp: string | null = '192.0.2.1') {
  return appendVoteAtomically({
    pollId: id,
    submissionId,
    responseId: `response-${submissionId}`,
    response: { id: `response-${submissionId}` },
    clientIp,
    now,
  })
}

describe('Redis selection', () => {
  beforeEach(() => resetRedisForTests())
  afterEach(() => {
    vi.unstubAllEnvs()
    resetRedisForTests()
  })

  it('allows in-memory storage in unit tests', () => {
    expect(isInMemoryRedisAllowed()).toBe(true)
    expect(getRedis()).toBe(inMemoryRedis)
  })

  it('allows E2E storage only for loopback without a deployment marker', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('E2E_TEST', '1')
    vi.stubEnv('E2E_BASE_URL', 'http://127.0.0.1:3000')
    vi.stubEnv('VERCEL', '')
    expect(isInMemoryRedisAllowed()).toBe(true)
    vi.stubEnv('VERCEL', '1')
    expect(isInMemoryRedisAllowed()).toBe(false)
  })

  it.each([
    ['https://example.com', ''],
    ['not a url', ''],
    ['http://localhost:3000', 'production-service'],
  ])('rejects remote/invalid E2E URLs and non-Vercel deployment markers', (baseUrl, renderMarker) => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('E2E_TEST', '1')
    vi.stubEnv('E2E_BASE_URL', baseUrl)
    vi.stubEnv('RENDER_SERVICE_ID', renderMarker)
    expect(isInMemoryRedisAllowed()).toBe(false)
  })

  it('fails with a direct message when durable Redis is unconfigured', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('E2E_TEST', '')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    expect(() => getRedis()).toThrow(/UPSTASH_REDIS_REST_URL.*UPSTASH_REDIS_REST_TOKEN/)
  })
})

describe('atomic vote append', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test')
    resetRedisForTests()
  })
  afterEach(() => vi.unstubAllEnvs())

  it('appends concurrent submissions without overwriting and refreshes every data TTL', async () => {
    await seedPoll()
    const results = await Promise.all([
      append('poll123456', 'submission-a', '192.0.2.1'),
      append('poll123456', 'submission-b', '192.0.2.2'),
    ])
    expect(results.map((result) => result.status)).toEqual(['appended', 'appended'])
    expect(await inMemoryRedis.lrange('poll:poll123456:responses', 0, -1)).toHaveLength(2)
    for (const key of [
      'poll:poll123456',
      'poll:poll123456:responses',
      'poll:poll123456:submissions',
    ]) {
      expect(inMemoryRedis.getTtl(key)).toBeGreaterThan(POLL_IDLE_TTL_SECONDS - 2)
      expect(inMemoryRedis.getTtl(key)).toBeLessThanOrEqual(POLL_IDLE_TTL_SECONDS)
    }
  })

  it('returns a known duplicate before consuming exhausted rate capacity', async () => {
    await seedPoll()
    await append('poll123456', 'original')
    for (let index = 1; index < 20; index += 1) {
      expect((await append('poll123456', `unique-${index}`)).status).toBe('appended')
    }
    expect((await append('poll123456', 'blocked')).status).toBe('rate_limited')
    expect(await append('poll123456', 'original')).toMatchObject({
      status: 'duplicate',
      responseId: 'response-original',
    })
  })

  it('enforces the independent 100-per-hour poll bucket across many client IPs', async () => {
    await seedPoll('busyPoll01')
    for (let index = 0; index < 100; index += 1) {
      const result = await append(
        'busyPoll01',
        `submission-${index}`,
        `192.0.2.${(index % 250) + 1}`
      )
      expect(result.status).toBe('appended')
    }
    expect(await append('busyPoll01', 'submission-101', '198.51.100.1')).toMatchObject({
      status: 'rate_limited',
      scope: 'poll',
    })
  })

  it('rejects an unknown submission without identity but accepts a known duplicate first', async () => {
    await seedPoll()
    expect((await append('poll123456', 'unknown', null)).status).toBe('identity_unavailable')
    expect((await append('poll123456', 'original')).status).toBe('appended')
    expect(await append('poll123456', 'original', null)).toMatchObject({
      status: 'duplicate',
      responseId: 'response-original',
    })
  })

  it('rejects missing, expired, and full polls without creating responses', async () => {
    expect((await append('missingpoll', 'one')).status).toBe('not_found')
    await seedPoll('expiredpoll', now - POLL_ABSOLUTE_TTL_SECONDS * 1000)
    expect((await append('expiredpoll', 'one')).status).toBe('expired')
    await seedPoll('fullpoll12')
    await inMemoryRedis.rpush(
      'poll:fullpoll12:responses',
      ...Array.from({ length: MAX_POLL_RESPONSES }, (_, index) => JSON.stringify({ id: index }))
    )
    expect((await append('fullpoll12', 'one')).status).toBe('capacity_reached')
  })

  it('recognizes a duplicate before enforcing the 250-response capacity', async () => {
    await seedPoll('fullretry1')
    expect((await append('fullretry1', 'original')).status).toBe('appended')
    await inMemoryRedis.rpush(
      'poll:fullretry1:responses',
      ...Array.from({ length: MAX_POLL_RESPONSES - 1 }, (_, index) => JSON.stringify({ id: index }))
    )
    expect((await append('fullretry1', 'new')).status).toBe('capacity_reached')
    expect((await append('fullretry1', 'original', null)).status).toBe('duplicate')
  })

  it('caps the refreshed idle TTL at the 90-day absolute lifetime', async () => {
    const remainingSeconds = 60 * 60
    await seedPoll('oldpoll123', now - (POLL_ABSOLUTE_TTL_SECONDS - remainingSeconds) * 1000)
    expect((await append('oldpoll123', 'one')).status).toBe('appended')
    expect(inMemoryRedis.getTtl('poll:oldpoll123')).toBeLessThanOrEqual(remainingSeconds)
    expect(inMemoryRedis.getTtl('poll:oldpoll123')).toBeGreaterThan(remainingSeconds - 2)
  })
})

describe('rate limiting and trusted client identity', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test')
    resetRedisForTests()
  })
  afterEach(() => vi.unstubAllEnvs())

  it('atomically limits poll creation and includes Retry-After data', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 11 }, () => checkPollCreateRateLimit('192.0.2.8'))
    )
    expect(attempts.filter((result) => result.allowed)).toHaveLength(10)
    expect(attempts[10]).toMatchObject({ allowed: false, remaining: 0 })
    if (!attempts[10].allowed) expect(attempts[10].retryAfterSeconds).toBeGreaterThan(0)
  })

  it('uses only Vercel-owned headers on Vercel production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL', '1')
    const headers = new Headers({
      'x-vercel-forwarded-for': '203.0.113.4, 10.0.0.2',
      'x-forwarded-for': '198.51.100.99',
    })
    expect(resolveClientIp({ headers })).toEqual({ status: 'resolved', ip: '203.0.113.4' })
  })

  it('fails closed for an untrusted self-hosted production proxy', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL', '')
    vi.stubEnv('TRUST_PROXY', '')
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7' })
    expect(resolveClientIp({ headers })).toEqual({ status: 'unavailable', reason: 'untrusted_proxy' })
  })

  it('honors x-forwarded-for only behind an explicitly trusted self-hosted proxy', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL', '')
    vi.stubEnv('TRUST_PROXY', '1')
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.4' })
    expect(resolveClientIp({ headers })).toEqual({ status: 'resolved', ip: '203.0.113.7' })
  })

  it('does not fall back to spoofable forwarded headers on Vercel', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL', '1')
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7' })
    expect(resolveClientIp({ headers })).toEqual({ status: 'unavailable', reason: 'missing' })
  })

  it('rejects malformed platform identity instead of creating an attacker-controlled Redis key', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL', '1')
    const headers = new Headers({
      'x-vercel-forwarded-for': 'not-an-ip',
      'x-forwarded-for': '203.0.113.7',
    })
    expect(resolveClientIp({ headers })).toEqual({ status: 'unavailable', reason: 'missing' })
  })
})
