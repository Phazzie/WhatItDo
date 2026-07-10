import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { mockRedis } from '@/test/mockRedis'

const THIRTY_DAYS_SECONDS_MOCK = 60 * 60 * 24 * 30

// Reimplements the small redis.ts helpers against this test's `mockRedis`
// instance (rather than partially mocking the real module) so route tests
// exercise the same sliding-window-log logic without depending on module
// load order / env vars for the real Upstash client.
vi.mock('@/lib/redis', () => ({
  redis: mockRedis,
  POLL_TTL_SECONDS: THIRTY_DAYS_SECONDS_MOCK,
  checkRateLimit: async (key: string, limit: number, windowSeconds: number) => {
    const now = Date.now()
    const raw = await mockRedis.get<string>(key)
    const timestamps: number[] = raw ? JSON.parse(raw) : []
    const windowStart = now - windowSeconds * 1000
    const recent = timestamps.filter((t) => t > windowStart)
    if (recent.length >= limit) return false
    recent.push(now)
    await mockRedis.set(key, JSON.stringify(recent), { ex: windowSeconds })
    return true
  },
  getClientIp: (request: { headers: { get(name: string): string | null } }) => {
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) return forwardedFor.split(',')[0].trim()
    return 'unknown'
  },
}))

function postRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/poll', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...headers },
  })
}

describe('POST /api/poll validation (2.1, C3/H3)', () => {
  beforeEach(() => {
    mockRedis.reset()
    vi.resetModules()
  })

  it('rejects more than 3 suggestions', async () => {
    const { POST } = await import('./route')
    const suggestions = Array.from({ length: 50 }, (_, i) => `Option ${i}`)
    const response = await POST(postRequest({ title: 'Big poll', suggestions }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBeTruthy()
  })

  it('rejects a malformed JSON body with 400, not 500', async () => {
    const { POST } = await import('./route')
    const response = await POST(postRequest('{not json'))
    expect(response.status).toBe(400)
  })

  it('accepts a valid poll', async () => {
    const { POST } = await import('./route')
    const response = await POST(postRequest({ title: 'Dinner', suggestions: ['Pizza', 'Tacos'] }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.id).toBeTruthy()
  })
})

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30

describe('POST /api/poll TTL (2.5, H2)', () => {
  beforeEach(() => {
    mockRedis.reset()
  })

  it('sets a 30-day TTL on the poll key', async () => {
    const { POST } = await import('./route')
    const response = await POST(postRequest({ title: 'Dinner', suggestions: ['Pizza', 'Tacos'] }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(mockRedis.getTtl(`poll:${json.id}`)).toBe(THIRTY_DAYS_SECONDS)
  })
})

describe('POST /api/poll rate limiting (2.5, C5)', () => {
  const originalEnv = process.env.RATE_LIMIT_ENABLED

  beforeEach(() => {
    mockRedis.reset()
    vi.resetModules()
  })

  afterEach(() => {
    process.env.RATE_LIMIT_ENABLED = originalEnv
  })

  it('passes through with no limiting when RATE_LIMIT_ENABLED is unset (dev/test default)', async () => {
    delete process.env.RATE_LIMIT_ENABLED
    const { POST } = await import('./route')

    for (let i = 0; i < 15; i++) {
      const response = await POST(
        postRequest(
          { title: 'Dinner', suggestions: ['Pizza'] },
          { 'x-forwarded-for': '10.0.0.1' }
        )
      )
      expect(response.status).toBe(200)
    }
  })

  it('returns 429 after the poll limit (10/hr) is exceeded when enabled', async () => {
    process.env.RATE_LIMIT_ENABLED = '1'
    const { POST } = await import('./route')

    const statuses: number[] = []
    for (let i = 0; i < 12; i++) {
      const response = await POST(
        postRequest(
          { title: 'Dinner', suggestions: ['Pizza'] },
          { 'x-forwarded-for': '10.0.0.2' }
        )
      )
      statuses.push(response.status)
    }

    expect(statuses.filter((s) => s === 200).length).toBe(10)
    expect(statuses.filter((s) => s === 429).length).toBe(2)
  })
})

describe('GET /api/poll merges the responses list (2.2, C1)', () => {
  beforeEach(() => {
    mockRedis.reset()
  })

  it('merges poll:{id}:responses into the returned poll', async () => {
    const { GET } = await import('./route')

    const poll = {
      id: 'poll-merge',
      title: 'Dinner',
      suggestions: ['Pizza', 'Tacos'],
      creatorEmail: 'creator@example.com',
      createdAt: Date.now(),
      responses: [],
      mode: 'normal',
    }
    await mockRedis.set(`poll:${poll.id}`, JSON.stringify(poll))
    await mockRedis.rpush(
      `poll:${poll.id}:responses`,
      JSON.stringify({ id: 'r1', voterName: 'Alice', votes: [], submittedAt: Date.now() }),
      JSON.stringify({ id: 'r2', voterName: 'Bob', votes: [], submittedAt: Date.now() })
    )

    const request = new NextRequest(`http://localhost/api/poll?id=${poll.id}`)
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.poll.responses).toHaveLength(2)
    expect(json.poll.responses[0].voterName).toBe('Alice')
  })

  it('returns 404, not a crash, for an id crafted to collide with the responses list key (self-review)', async () => {
    const { GET } = await import('./route')

    await mockRedis.rpush(
      'poll:real-poll:responses',
      JSON.stringify({ id: 'r1', voterName: 'Alice', votes: [], submittedAt: Date.now() })
    )

    const request = new NextRequest('http://localhost/api/poll?id=real-poll:responses')
    const response = await GET(request)

    expect(response.status).toBe(404)
  })
})

describe('creatorEmail is never exposed to clients (Codex review)', () => {
  beforeEach(() => {
    mockRedis.reset()
    vi.unstubAllEnvs()
    vi.stubEnv('POLL_CREATOR_EMAIL', 'secret-owner@example.com')
  })

  it('POST /api/poll response omits creatorEmail', async () => {
    const { POST } = await import('./route')
    const res = await POST(postRequest({ suggestions: ['A'], mode: 'normal' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(JSON.stringify(data)).not.toContain('secret-owner@example.com')
    expect(data.poll).not.toHaveProperty('creatorEmail')
  })

  it('GET /api/poll response omits creatorEmail', async () => {
    const { POST, GET } = await import('./route')
    const createRes = await POST(postRequest({ suggestions: ['A'], mode: 'normal' }))
    const { id } = await createRes.json()
    const res = await GET(new NextRequest(`http://localhost/api/poll?id=${id}`))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(JSON.stringify(data)).not.toContain('secret-owner@example.com')
    expect(data.poll).not.toHaveProperty('creatorEmail')
  })
})
