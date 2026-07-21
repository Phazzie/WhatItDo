import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const upstash = vi.hoisted(() => {
  const client = {
    get: vi.fn(),
    set: vi.fn(),
    lrange: vi.fn(),
    eval: vi.fn(),
  }
  return {
    client,
    Redis: vi.fn(function Redis() {
      return client
    }),
  }
})

vi.mock('@upstash/redis', () => ({ Redis: upstash.Redis }))

import {
  APPEND_VOTE_LUA_SCRIPT,
  CREATE_POLL_LUA_SCRIPT,
  POLL_IDLE_TTL_SECONDS,
  RATE_LIMIT_LUA_SCRIPT,
  appendVoteAtomically,
  checkPollCreateRateLimit,
  createPollAtomically,
  getRedis,
  resetRedisForTests,
} from './redis'

describe('durable Upstash adapter', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('E2E_TEST', '')
    vi.stubEnv('REDIS_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token')
    resetRedisForTests()
    upstash.Redis.mockClear()
    Object.values(upstash.client).forEach((mock) => mock.mockReset())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    resetRedisForTests()
  })

  it('constructs lazily and forwards the minimal command surface', async () => {
    expect(upstash.Redis).not.toHaveBeenCalled()
    upstash.client.get.mockResolvedValue('value')
    upstash.client.set.mockResolvedValue('OK')
    upstash.client.lrange.mockResolvedValue(['a'])

    const client = getRedis()
    expect(upstash.Redis).toHaveBeenCalledWith({
      url: 'https://example.upstash.io',
      token: 'test-token',
      retry: { retries: 0 },
      signal: expect.any(Function),
    })
    expect(getRedis()).toBe(client)
    await expect(client.get('key')).resolves.toBe('value')
    await client.set('plain', 'value')
    await client.set('expiring', 'value', { ex: 60 })
    await expect(client.lrange('list', 0, -1)).resolves.toEqual(['a'])
    expect(upstash.client.set).toHaveBeenNthCalledWith(1, 'plain', 'value')
    expect(upstash.client.set).toHaveBeenNthCalledWith(2, 'expiring', 'value', { ex: 60 })
  })

  it('creates a fresh five-second abort signal for every Upstash request', async () => {
    vi.useFakeTimers()
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockImplementation((milliseconds) => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), milliseconds)
      return controller.signal
    })
    try {
      getRedis()
      const [options] = upstash.Redis.mock.calls[0] as unknown as [{
        retry: { retries: number }
        signal: () => AbortSignal
      }]

      expect(options.retry).toEqual({ retries: 0 })
      expect(options.signal).toEqual(expect.any(Function))

      const firstSignal = options.signal()
      const secondSignal = options.signal()
      expect(timeoutSpy).toHaveBeenNthCalledWith(1, 5_000)
      expect(timeoutSpy).toHaveBeenNthCalledWith(2, 5_000)
      expect(firstSignal).not.toBe(secondSignal)
      expect(firstSignal.aborted).toBe(false)
      expect(secondSignal.aborted).toBe(false)

      await vi.advanceTimersByTimeAsync(4_999)
      expect(firstSignal.aborted).toBe(false)
      expect(secondSignal.aborted).toBe(false)

      await vi.advanceTimersByTimeAsync(1)
      expect(firstSignal.aborted).toBe(true)
      expect(secondSignal.aborted).toBe(true)
    } finally {
      timeoutSpy.mockRestore()
      vi.useRealTimers()
    }
  })

  it('makes one real SDK fetch on failure and creates a new signal per command', async () => {
    const { Redis: ActualRedis } = await vi.importActual<typeof import('@upstash/redis')>(
      '@upstash/redis'
    )
    const firstSignal = new AbortController().signal
    const secondSignal = new AbortController().signal
    const signalFactory = vi.fn().mockReturnValueOnce(firstSignal).mockReturnValueOnce(secondSignal)
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('simulated network failure'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ result: null }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )
    vi.stubGlobal('fetch', fetchMock)

    const client = new ActualRedis({
      url: 'https://example.upstash.io',
      token: 'test-token',
      retry: { retries: 0 },
      signal: signalFactory,
    })

    await expect(client.eval('return 1', [], [])).rejects.toThrow('simulated network failure')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(firstSignal)

    await expect(client.get('key')).resolves.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1]?.[1]?.signal).toBe(secondSignal)
    expect(signalFactory).toHaveBeenCalledTimes(2)
  })

  it('parses allowed and limited fixed-window Lua results', async () => {
    upstash.client.eval
      .mockResolvedValueOnce(['allowed', 9])
      .mockResolvedValueOnce(['limited', 42])
    await expect(checkPollCreateRateLimit('203.0.113.1')).resolves.toEqual({
      allowed: true,
      remaining: 9,
    })
    await expect(checkPollCreateRateLimit('203.0.113.1')).resolves.toEqual({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 42,
    })
    expect(upstash.client.eval).toHaveBeenCalledWith(
      RATE_LIMIT_LUA_SCRIPT,
      ['ratelimit:poll:203.0.113.1'],
      [10, 3600]
    )
  })

  it('creates a poll through the three-key Lua boundary and parses namespace conflicts', async () => {
    const poll = {
      id: 'poll123456',
      title: 'Atomic poll',
      suggestions: ['A'],
      mode: 'normal' as const,
      createdAt: 1_800_000_000_000,
      expiresAt: 1_807_776_000_000,
      resultsTokenHash: 'a'.repeat(64),
    }
    upstash.client.eval
      .mockResolvedValueOnce(['created'])
      .mockResolvedValueOnce(['namespace_conflict'])

    await expect(createPollAtomically(poll)).resolves.toEqual({ status: 'created' })
    expect(upstash.client.eval).toHaveBeenNthCalledWith(
      1,
      CREATE_POLL_LUA_SCRIPT,
      [
        'poll:poll123456',
        'poll:poll123456:responses',
        'poll:poll123456:submissions',
      ],
      [JSON.stringify(poll), POLL_IDLE_TTL_SECONDS]
    )
    await expect(createPollAtomically(poll)).resolves.toEqual({ status: 'namespace_conflict' })
  })

  it.each([
    [['appended', 'response-1', 2], { status: 'appended', responseId: 'response-1', responseCount: 2 }],
    [['duplicate', 'response-1', 2], { status: 'duplicate', responseId: 'response-1', responseCount: 2 }],
    [['idempotency_conflict'], { status: 'idempotency_conflict' }],
    [['not_found'], { status: 'not_found' }],
    [['expired'], { status: 'expired' }],
    [['identity_unavailable'], { status: 'identity_unavailable' }],
    [['capacity_reached'], { status: 'capacity_reached' }],
    [['rate_limited', 'poll', 31], { status: 'rate_limited', scope: 'poll', retryAfterSeconds: 31 }],
    [['rate_limited', 'ip', 0], { status: 'rate_limited', scope: 'ip', retryAfterSeconds: 1 }],
  ] as const)('parses an atomic append result: %j', async (raw, expected) => {
    upstash.client.eval.mockResolvedValue(raw)
    await expect(appendVoteAtomically({
      pollId: 'poll123456',
      submissionId: 'submission',
      submissionDigest: 'digest:submission',
      responseId: 'response-1',
      response: { safe: true },
      clientIp: '203.0.113.2',
      now: 1_800_000_000_000,
    })).resolves.toEqual(expected)
    expect(upstash.client.eval.mock.calls[0][0]).toBe(APPEND_VOTE_LUA_SCRIPT)
    expect(upstash.client.eval.mock.calls[0][1]).toContain('ratelimit:vote:ip:203.0.113.2')
    expect(upstash.client.eval.mock.calls[0][2].at(-2)).toBe(1)
    expect(upstash.client.eval.mock.calls[0][2].at(-1)).toBe('digest:submission')
  })

  it('passes identity loss into Lua and rejects malformed Redis replies', async () => {
    upstash.client.eval.mockResolvedValueOnce(['identity_unavailable'])
    await appendVoteAtomically({
      pollId: 'poll123456',
      submissionId: 'submission',
      submissionDigest: 'digest:submission',
      responseId: 'response-1',
      response: {},
      clientIp: null,
      now: 1,
    })
    expect(upstash.client.eval.mock.calls[0][2].at(-2)).toBe(0)

    upstash.client.eval.mockResolvedValueOnce(['corrupt'])
    await expect(appendVoteAtomically({
      pollId: 'poll123456', submissionId: 'a', submissionDigest: 'digest:a',
      responseId: 'b', response: {}, clientIp: '203.0.113.2',
    })).rejects.toThrow('Stored poll is corrupt')

    upstash.client.eval.mockResolvedValueOnce('not-an-array')
    await expect(checkPollCreateRateLimit('203.0.113.2')).rejects.toThrow('invalid rate-limit result')
    upstash.client.eval.mockResolvedValueOnce(['mystery'])
    await expect(checkPollCreateRateLimit('203.0.113.2')).rejects.toThrow('unknown rate-limit status')
  })
})
