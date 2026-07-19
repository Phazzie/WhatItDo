import { randomUUID } from 'node:crypto'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createClient } from 'redis'
import {
  APPEND_VOTE_LUA_SCRIPT,
  CREATE_POLL_LUA_SCRIPT,
  MAX_POLL_RESPONSES,
  POLL_ABSOLUTE_TTL_SECONDS,
  POLL_IDLE_TTL_SECONDS,
  RATE_LIMIT_LUA_SCRIPT,
  RATE_LIMIT_WINDOW_SECONDS,
  VOTE_IP_RATE_LIMIT,
  VOTE_POLL_RATE_LIMIT,
  appendVoteAtomically,
  createPollAtomically,
  getRedis,
  resetRedisForTests,
} from './redis'

const describeRedis = process.env.REDIS_URL ? describe : describe.skip

describeRedis('Redis 7 Lua integration', () => {
  const client = createClient({ url: process.env.REDIS_URL })
  const runId = randomUUID()
  const cleanupKeys = new Set<string>()

  type AppendKeys = [string, string, string, string, string]

  beforeAll(async () => {
    await client.connect()
  })

  afterEach(async () => {
    if (cleanupKeys.size > 0) {
      await client.del([...cleanupKeys])
      cleanupKeys.clear()
    }
  })

  afterAll(async () => {
    if (client.isOpen) await client.quit()
  })

  function keysFor(pollId: string, ip: string = randomUUID()): AppendKeys {
    const keys: AppendKeys = [
      `integration:${runId}:poll:${pollId}`,
      `integration:${runId}:poll:${pollId}:responses`,
      `integration:${runId}:poll:${pollId}:submissions`,
      `integration:${runId}:ratelimit:vote:ip:${ip}`,
      `integration:${runId}:ratelimit:vote:poll:${pollId}`,
    ]
    keys.forEach((key) => cleanupKeys.add(key))
    return keys
  }

  async function createPoll(options?: {
    pollId?: string
    ip?: string
    createdAt?: number
    expiresAt?: number
    initialTtlSeconds?: number
  }): Promise<AppendKeys> {
    const now = Date.now()
    const pollId = options?.pollId ?? randomUUID()
    const createdAt = options?.createdAt ?? now
    const expiresAt = options?.expiresAt ?? createdAt + POLL_ABSOLUTE_TTL_SECONDS * 1000
    const keys = keysFor(pollId, options?.ip)
    await client.set(keys[0], JSON.stringify({ id: pollId, createdAt, expiresAt }), {
      EX: options?.initialTtlSeconds ?? POLL_IDLE_TTL_SECONDS,
    })
    return keys
  }

  async function append(
    keys: AppendKeys,
    submissionId: string,
    responseId: string,
    options?: { identityAvailable?: boolean; now?: number; submissionDigest?: string }
  ): Promise<unknown[]> {
    return client.eval(APPEND_VOTE_LUA_SCRIPT, {
      keys,
      arguments: [
        submissionId,
        responseId,
        JSON.stringify({ id: responseId }),
        String(options?.now ?? Date.now()),
        String(POLL_IDLE_TTL_SECONDS),
        String(POLL_ABSOLUTE_TTL_SECONDS),
        String(RATE_LIMIT_WINDOW_SECONDS),
        String(VOTE_IP_RATE_LIMIT),
        String(VOTE_POLL_RATE_LIMIT),
        String(MAX_POLL_RESPONSES),
        options?.identityAvailable === false ? '0' : '1',
        options?.submissionDigest ?? `digest:${submissionId}`,
      ],
    }) as Promise<unknown[]>
  }

  async function pollTtls(keys: AppendKeys): Promise<number[]> {
    return Promise.all(keys.slice(0, 3).map((key) => client.ttl(key)))
  }

  it('uses the production adapter for real SET, EVAL, and LRANGE commands', async () => {
    const pollId = randomUUID().replaceAll('-', '').slice(0, 10)
    const responseId = randomUUID().replaceAll('-', '').slice(0, 12)
    const submissionId = randomUUID()
    const clientIp = '192.0.2.44'
    const setKey = `integration:${runId}:adapter:set:${pollId}`
    const pollKeys = [
      `poll:${pollId}`,
      `poll:${pollId}:responses`,
      `poll:${pollId}:submissions`,
      `ratelimit:vote:ip:${clientIp}`,
      `ratelimit:vote:poll:${pollId}`,
    ]
    const testKeys = [setKey, ...pollKeys]
    testKeys.forEach((key) => cleanupKeys.add(key))

    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('E2E_TEST', '')
    resetRedisForTests()

    try {
      await client.del(testKeys)
      const redis = getRedis()

      await redis.set(setKey, 'protocol-adapter', { ex: 60 })
      expect(await redis.get(setKey)).toBe('protocol-adapter')
      expect(await client.ttl(setKey)).toBeGreaterThan(0)

      const now = Date.now()
      expect(await createPollAtomically({
        id: pollId,
        title: 'Protocol adapter integration',
        suggestions: ['Keep the real connection'],
        mode: 'normal',
        createdAt: now,
        expiresAt: now + POLL_ABSOLUTE_TTL_SECONDS * 1000,
        resultsTokenHash: 'a'.repeat(64),
      })).toEqual({ status: 'created' })

      expect(await appendVoteAtomically({
        pollId,
        submissionId,
        submissionDigest: 'b'.repeat(64),
        responseId,
        clientIp,
        response: {
          id: responseId,
          voterName: 'Protocol Voter',
          votes: [{
            text: 'Keep the real connection',
            vote: 'yes',
            comment: 'SET, EVAL, and LRANGE all crossed the adapter.',
          }],
          submittedAt: now,
        },
        now,
      })).toEqual({ status: 'appended', responseId, responseCount: 1 })

      const storedResponses = await redis.lrange(pollKeys[1], 0, -1)
      expect(storedResponses).toHaveLength(1)
      expect(JSON.parse(storedResponses[0])).toMatchObject({
        id: responseId,
        voterName: 'Protocol Voter',
      })
      expect(getRedis()).toBe(redis)
    } finally {
      resetRedisForTests()
      vi.unstubAllEnvs()
      await client.del(testKeys)
      testKeys.forEach((key) => cleanupKeys.delete(key))
    }
  })

  it('atomically allows only one creator to claim a free three-key namespace', async () => {
    const pollId = randomUUID()
    const keys = [
      `integration:${runId}:create:${pollId}`,
      `integration:${runId}:create:${pollId}:responses`,
      `integration:${runId}:create:${pollId}:submissions`,
    ]
    keys.forEach((key) => cleanupKeys.add(key))
    const pollJson = JSON.stringify({ id: pollId, createdAt: Date.now() })
    const create = () => client.eval(CREATE_POLL_LUA_SCRIPT, {
      keys,
      arguments: [pollJson, String(POLL_IDLE_TTL_SECONDS)],
    }) as Promise<unknown[]>

    const results = await Promise.all([create(), create()])

    expect(results.map((result) => result[0]).sort()).toEqual(['created', 'namespace_conflict'])
    expect(await client.get(keys[0])).toBe(pollJson)
    expect(await client.ttl(keys[0])).toBeGreaterThan(POLL_IDLE_TTL_SECONDS - 2)
    expect(await Promise.all(keys.slice(1).map((key) => client.exists(key)))).toEqual([0, 0])
  })

  it.each(['responses', 'submissions'])('does not overwrite an occupied %s companion namespace', async (suffix) => {
    const pollId = randomUUID()
    const keys = [
      `integration:${runId}:collision:${pollId}`,
      `integration:${runId}:collision:${pollId}:responses`,
      `integration:${runId}:collision:${pollId}:submissions`,
    ]
    keys.forEach((key) => cleanupKeys.add(key))
    const occupiedIndex = suffix === 'responses' ? 1 : 2
    await client.set(keys[occupiedIndex], 'existing-private-data')

    const result = await client.eval(CREATE_POLL_LUA_SCRIPT, {
      keys,
      arguments: [JSON.stringify({ id: pollId }), String(POLL_IDLE_TTL_SECONDS)],
    }) as unknown[]

    expect(result).toEqual(['namespace_conflict'])
    expect(await client.exists(keys[0])).toBe(0)
    expect(await client.get(keys[occupiedIndex])).toBe('existing-private-data')
  })

  it('atomically appends concurrent votes and deduplicates a retry', async () => {
    const keys = await createPoll()
    const [first, second] = await Promise.all([
      append(keys, 'submission-a', 'response-a'),
      append(keys, 'submission-b', 'response-b'),
    ])
    expect(first[0]).toBe('appended')
    expect(second[0]).toBe('appended')
    expect(await client.lLen(keys[1])).toBe(2)

    const duplicate = await append(keys, 'submission-a', 'different-response-id')
    expect(duplicate.slice(0, 2)).toEqual(['duplicate', 'response-a'])
    expect(await client.lLen(keys[1])).toBe(2)
    expect(await client.ttl(keys[0])).toBeLessThanOrEqual(POLL_IDLE_TTL_SECONDS)
    expect(await client.ttl(keys[2])).toBeGreaterThan(0)
  })

  it('fails a new identity-less vote closed but still recognizes a stored retry', async () => {
    const keys = await createPoll()
    expect(
      (await append(keys, 'missing-identity', 'never-stored', { identityAvailable: false }))[0]
    ).toBe('identity_unavailable')
    await append(keys, 'stored-before-loss', 'stored-response')
    const retry = await append(keys, 'stored-before-loss', 'different-response', {
      identityAvailable: false,
    })
    expect(retry.slice(0, 2)).toEqual(['duplicate', 'stored-response'])
  })

  it('rejects changed ballot reuse and legacy receipts before identity or rate mutation', async () => {
    const keys = await createPoll()
    expect((await append(keys, 'submission-a', 'response-a', {
      submissionDigest: 'digest:one',
    }))[0]).toBe('appended')

    expect(await append(keys, 'submission-a', 'different-response', {
      identityAvailable: false,
      submissionDigest: 'digest:changed',
    })).toEqual(['idempotency_conflict'])
    expect(await client.lLen(keys[1])).toBe(1)
    expect(Number(await client.get(keys[3]))).toBe(1)
    expect(JSON.parse(await client.hGet(keys[2], 'submission-a') as string)).toEqual({
      responseId: 'response-a',
      digest: 'digest:one',
    })

    const legacyKeys = await createPoll({ pollId: randomUUID(), ip: 'legacy-ip' })
    await client.hSet(legacyKeys[2], 'legacy-submission', 'legacy-response-id')
    expect(await append(legacyKeys, 'legacy-submission', 'never-stored', {
      identityAvailable: false,
    })).toEqual(['idempotency_conflict'])
    expect(await client.lLen(legacyKeys[1])).toBe(0)
    expect(await client.exists(legacyKeys[3])).toBe(0)
    expect(await client.exists(legacyKeys[4])).toBe(0)
  })

  it('enforces the per-IP append limit without recording the rejected vote', async () => {
    const keys = await createPoll({ ip: 'shared-ip' })
    for (let attempt = 0; attempt < VOTE_IP_RATE_LIMIT; attempt += 1) {
      const result = await append(keys, `submission-${attempt}`, `response-${attempt}`)
      expect(result[0]).toBe('appended')
    }

    const limited = await append(keys, 'submission-limited', 'response-limited')
    expect(limited[0]).toBe('rate_limited')
    expect(limited[1]).toBe('ip')
    expect(Number(limited[2])).toBeGreaterThan(0)
    expect(await client.lLen(keys[1])).toBe(VOTE_IP_RATE_LIMIT)
    expect(Number(await client.get(keys[4]))).toBe(VOTE_IP_RATE_LIMIT)
  })

  it('enforces the per-poll append limit across distinct IP buckets', async () => {
    const pollId = randomUUID()
    const firstKeys = await createPoll({ pollId, ip: 'ip-0' })
    for (let attempt = 0; attempt < VOTE_POLL_RATE_LIMIT; attempt += 1) {
      const keys = attempt === 0 ? firstKeys : keysFor(pollId, `ip-${attempt}`)
      const result = await append(keys, `submission-${attempt}`, `response-${attempt}`)
      expect(result[0]).toBe('appended')
    }

    const limitedKeys = keysFor(pollId, 'ip-limited')
    const limited = await append(limitedKeys, 'submission-limited', 'response-limited')
    expect(limited[0]).toBe('rate_limited')
    expect(limited[1]).toBe('poll')
    expect(Number(limited[2])).toBeGreaterThan(0)
    expect(await client.lLen(firstKeys[1])).toBe(VOTE_POLL_RATE_LIMIT)
    expect(await client.exists(limitedKeys[3])).toBe(0)
  })

  it('accepts response 250 and rejects response 251 without mutating Redis', async () => {
    const keys = await createPoll()
    const seededResponses = Array.from(
      { length: MAX_POLL_RESPONSES - 1 },
      (_, index) => JSON.stringify({ id: `seeded-${index}` })
    )
    await client.rPush(keys[1], seededResponses)

    const finalAllowed = await append(keys, 'submission-250', 'response-250')
    expect(finalAllowed).toEqual(['appended', 'response-250', MAX_POLL_RESPONSES])

    const rejected = await append(keys, 'submission-251', 'response-251')
    expect(rejected).toEqual(['capacity_reached'])
    expect(await client.lLen(keys[1])).toBe(MAX_POLL_RESPONSES)
    expect(await client.hExists(keys[2], 'submission-251')).toBe(0)
    expect(Number(await client.get(keys[3]))).toBe(1)
  })

  it('deletes poll data when the absolute lifetime has elapsed', async () => {
    const now = Date.now()
    const keys = await createPoll({
      createdAt: now - POLL_ABSOLUTE_TTL_SECONDS * 1000 - 2_000,
      // A corrupt future expiresAt must not extend the createdAt-based absolute cap.
      expiresAt: now + POLL_ABSOLUTE_TTL_SECONDS * 1000,
    })
    await client.rPush(keys[1], JSON.stringify({ id: 'old-response' }))
    await client.hSet(keys[2], 'old-submission', 'old-response')

    expect((await append(keys, 'new-submission', 'new-response', { now }))[0]).toBe('expired')
    expect(await Promise.all(keys.slice(0, 3).map((key) => client.exists(key)))).toEqual([0, 0, 0])
    expect(await client.exists(keys[3])).toBe(0)
    expect(await client.exists(keys[4])).toBe(0)
  })

  it('refreshes all poll-data TTLs together after a successful append', async () => {
    const keys = await createPoll({ initialTtlSeconds: 10 })
    await client.rPush(keys[1], JSON.stringify({ id: 'existing-response' }))
    await client.hSet(keys[2], 'existing-submission', 'existing-response')
    await Promise.all([client.expire(keys[1], 7), client.expire(keys[2], 4)])

    expect((await append(keys, 'fresh-submission', 'fresh-response'))[0]).toBe('appended')
    const ttls = await pollTtls(keys)
    expect(Math.min(...ttls)).toBeGreaterThanOrEqual(POLL_IDLE_TTL_SECONDS - 2)
    expect(Math.max(...ttls)).toBeLessThanOrEqual(POLL_IDLE_TTL_SECONDS)
    expect(Math.max(...ttls) - Math.min(...ttls)).toBeLessThanOrEqual(1)
  })

  it('synchronizes TTL refreshes without crossing the absolute expiry cap', async () => {
    const now = Date.now()
    const secondsUntilAbsoluteExpiry = 120
    const createdAt = now - (POLL_ABSOLUTE_TTL_SECONDS - secondsUntilAbsoluteExpiry) * 1000
    const keys = await createPoll({
      createdAt,
      expiresAt: createdAt + POLL_ABSOLUTE_TTL_SECONDS * 1000,
      initialTtlSeconds: 600,
    })

    expect((await append(keys, 'submission-a', 'response-a', { now }))[0]).toBe('appended')
    const firstTtls = await pollTtls(keys)
    expect(Math.min(...firstTtls)).toBeGreaterThanOrEqual(secondsUntilAbsoluteExpiry - 1)
    expect(Math.max(...firstTtls)).toBeLessThanOrEqual(secondsUntilAbsoluteExpiry)
    expect(Math.max(...firstTtls) - Math.min(...firstTtls)).toBeLessThanOrEqual(1)

    expect(
      (await append(keys, 'submission-b', 'response-b', { now: now + 60_000 }))[0]
    ).toBe('appended')
    const secondTtls = await pollTtls(keys)
    expect(Math.min(...secondTtls)).toBeGreaterThanOrEqual(59)
    expect(Math.max(...secondTtls)).toBeLessThanOrEqual(60)
    expect(Math.max(...secondTtls) - Math.min(...secondTtls)).toBeLessThanOrEqual(1)
  })

  it('enforces a fixed-window limit atomically with Retry-After', async () => {
    const rateKey = `integration:${runId}:ratelimit:${randomUUID()}`
    cleanupKeys.add(rateKey)
    const attempts = await Promise.all(
      Array.from({ length: 11 }, () =>
        client.eval(RATE_LIMIT_LUA_SCRIPT, {
          keys: [rateKey],
          arguments: ['10', String(RATE_LIMIT_WINDOW_SECONDS)],
        }) as Promise<unknown[]>
      )
    )
    expect(attempts.filter((result) => result[0] === 'allowed')).toHaveLength(10)
    const limited = attempts.find((result) => result[0] === 'limited')
    expect(Number(limited?.[1])).toBeGreaterThan(0)
  })
})
