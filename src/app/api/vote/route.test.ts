import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { mockRedis } from '@/test/mockRedis'
import type { Poll } from '@/lib/types'

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
const sendMock = vi.fn().mockResolvedValue({ data: { id: 'email-1' } })

vi.mock('resend', () => {
  return {
    Resend: vi.fn().mockImplementation(function (this: { emails: { send: typeof sendMock } }) {
      this.emails = { send: sendMock }
    }),
  }
})

function postRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/vote', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...headers },
  })
}

const normalPoll: Poll = {
  id: 'poll1',
  title: 'What It Do?',
  suggestions: ['Pizza', 'Tacos'],
  creatorEmail: 'creator@example.com',
  createdAt: Date.now(),
  responses: [],
  mode: 'normal',
}

describe('POST /api/vote validation (2.1, C3/H3)', () => {
  beforeEach(async () => {
    mockRedis.reset()
    vi.resetModules()
    process.env.RESEND_API_KEY = 'test-key'
    await mockRedis.set(`poll:${normalPoll.id}`, JSON.stringify(normalPoll))
  })

  it('rejects a non-string vote value with 400 instead of throwing/500', async () => {
    const { POST } = await import('./route')
    const response = await POST(
      postRequest({
        pollId: normalPoll.id,
        voterName: 'Alice',
        votes: [
          { text: 'Pizza', vote: 123 },
          { text: 'Tacos', vote: 'no' },
        ],
      })
    )

    expect(response.status).toBe(400)
  })

  it('rejects malformed JSON with 400, not 500', async () => {
    const { POST } = await import('./route')
    const response = await POST(postRequest('{not json'))
    expect(response.status).toBe(400)
  })

  it('does not lose a response when two votes are submitted concurrently (2.2, C1)', async () => {
    const { POST } = await import('./route')

    const [responseA, responseB] = await Promise.all([
      POST(
        postRequest({
          pollId: normalPoll.id,
          voterName: 'Alice',
          votes: [
            { text: 'Pizza', vote: 'yes' },
            { text: 'Tacos', vote: 'no' },
          ],
        })
      ),
      POST(
        postRequest({
          pollId: normalPoll.id,
          voterName: 'Bob',
          votes: [
            { text: 'Pizza', vote: 'no' },
            { text: 'Tacos', vote: 'yes' },
          ],
        })
      ),
    ])

    expect(responseA.status).toBe(200)
    expect(responseB.status).toBe(200)

    const storedResponses = await mockRedis.lrange(`poll:${normalPoll.id}:responses`, 0, -1)
    expect(storedResponses.length).toBe(2)
  })

  it('escapes an XSS voterName before it reaches the notification email HTML (2.3, C2)', async () => {
    const { POST } = await import('./route')
    sendMock.mockClear()

    const response = await POST(
      postRequest({
        pollId: normalPoll.id,
        voterName: '<img src=x onerror=alert(1)>',
        votes: [
          { text: 'Pizza', vote: 'yes' },
          { text: 'Tacos', vote: 'no' },
        ],
      })
    )

    expect(response.status).toBe(200)
    expect(sendMock).toHaveBeenCalledTimes(1)
    const payload = sendMock.mock.calls[0][0]
    expect(payload.html).not.toContain('<img src=x onerror=alert(1)>')
    expect(payload.html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('falls back to request.nextUrl.origin when NEXT_PUBLIC_BASE_URL is unset and no origin header is sent (2.4, H1)', async () => {
    const { POST } = await import('./route')
    sendMock.mockClear()
    delete process.env.NEXT_PUBLIC_BASE_URL

    const response = await POST(
      new NextRequest('http://example.test/api/vote', {
        method: 'POST',
        body: JSON.stringify({
          pollId: normalPoll.id,
          voterName: 'Alice',
          votes: [
            { text: 'Pizza', vote: 'yes' },
            { text: 'Tacos', vote: 'no' },
          ],
        }),
        headers: { 'content-type': 'application/json' },
      })
    )

    expect(response.status).toBe(200)
    expect(sendMock).toHaveBeenCalledTimes(1)
    const payload = sendMock.mock.calls[0][0]
    expect(payload.html).not.toContain('undefined/results/')
    expect(payload.html).toContain('http://example.test/results/')
  })

  it('skips sending email and does not error when POLL_CREATOR_EMAIL/creatorEmail is unset (2.4, C4)', async () => {
    const { POST } = await import('./route')
    sendMock.mockClear()

    const pollWithoutEmail: Poll = { ...normalPoll, id: 'poll-no-email', creatorEmail: '' }
    await mockRedis.set(`poll:${pollWithoutEmail.id}`, JSON.stringify(pollWithoutEmail))

    const response = await POST(
      postRequest({
        pollId: pollWithoutEmail.id,
        voterName: 'Alice',
        votes: [
          { text: 'Pizza', vote: 'yes' },
          { text: 'Tacos', vote: 'no' },
        ],
      })
    )

    expect(response.status).toBe(200)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('accepts a valid vote', async () => {
    const { POST } = await import('./route')
    const response = await POST(
      postRequest({
        pollId: normalPoll.id,
        voterName: 'Alice',
        votes: [
          { text: 'Pizza', vote: 'yes' },
          { text: 'Tacos', vote: 'no' },
        ],
      })
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
  })
})

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30

describe('POST /api/vote TTL refresh (2.5, H2)', () => {
  beforeEach(async () => {
    mockRedis.reset()
    vi.resetModules()
    process.env.RESEND_API_KEY = 'test-key'
    await mockRedis.set(`poll:${normalPoll.id}`, JSON.stringify(normalPoll))
  })

  it('refreshes the 30-day TTL on both the poll key and the responses key after a vote', async () => {
    const { POST } = await import('./route')
    const response = await POST(
      postRequest({
        pollId: normalPoll.id,
        voterName: 'Alice',
        votes: [
          { text: 'Pizza', vote: 'yes' },
          { text: 'Tacos', vote: 'no' },
        ],
      })
    )

    expect(response.status).toBe(200)
    expect(mockRedis.getTtl(`poll:${normalPoll.id}`)).toBe(THIRTY_DAYS_SECONDS)
    expect(mockRedis.getTtl(`poll:${normalPoll.id}:responses`)).toBe(THIRTY_DAYS_SECONDS)
  })
})

describe('POST /api/vote rate limiting (2.5, C5)', () => {
  const originalEnv = process.env.RATE_LIMIT_ENABLED

  beforeEach(async () => {
    mockRedis.reset()
    vi.resetModules()
    process.env.RESEND_API_KEY = 'test-key'
    await mockRedis.set(`poll:${normalPoll.id}`, JSON.stringify(normalPoll))
  })

  afterEach(() => {
    process.env.RATE_LIMIT_ENABLED = originalEnv
  })

  it('returns 429 after the vote limit (20/hr) is exceeded when enabled', async () => {
    process.env.RATE_LIMIT_ENABLED = '1'
    const { POST } = await import('./route')

    const statuses: number[] = []
    for (let i = 0; i < 25; i++) {
      const response = await POST(
        postRequest(
          {
            pollId: normalPoll.id,
            voterName: 'Alice',
            votes: [
              { text: 'Pizza', vote: 'yes' },
              { text: 'Tacos', vote: 'no' },
            ],
          },
          { 'x-forwarded-for': '10.0.0.3' }
        )
      )
      statuses.push(response.status)
    }

    expect(statuses.filter((s) => s === 200).length).toBe(20)
    expect(statuses.filter((s) => s === 429).length).toBe(5)
  })
})
