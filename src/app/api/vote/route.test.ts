import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { inMemoryRedis } from '@/lib/inMemoryRedis'
import { getRedis, resetRedisForTests } from '@/lib/redis'
import { hashResultsToken } from '@/lib/resultsToken'
import type { StoredPoll } from '@/lib/types'

const sendMock = vi.fn()
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function (this: { emails: { send: typeof sendMock } }) {
    this.emails = { send: sendMock }
  }),
}))

const pollId = 'vote000001'
const submissionId = '550e8400-e29b-41d4-a716-446655440000'

function request(overrides: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/vote', {
    method: 'POST',
    body: JSON.stringify({
      pollId,
      submissionId,
      voterName: 'Alice',
      votes: [{ text: 'Pizza', vote: 'yes', comment: '' }],
      ...overrides,
    }),
    headers: { 'content-type': 'application/json', ...headers },
  })
}

async function seed(overrides: Partial<StoredPoll> = {}) {
  const now = Date.now()
  const poll: StoredPoll = {
    id: pollId, title: 'Dinner?', suggestions: ['Pizza'], mode: 'normal', createdAt: now,
    expiresAt: now + 60_000, resultsTokenHash: hashResultsToken('A_-bcdefghijklmnopqrstuv'), ...overrides,
  }
  await inMemoryRedis.set(`poll:${pollId}`, JSON.stringify(poll))
}

describe('POST /api/vote', () => {
  beforeEach(async () => {
    vi.unstubAllEnvs()
    resetRedisForTests()
    // Select the test-only client before individual cases exercise production
    // identity rules. The route still sees the same seeded storage instance.
    getRedis()
    sendMock.mockReset().mockResolvedValue({ data: { id: 'email-1' }, error: null })
    await seed()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('records a normalized vote and truthfully reports email is not configured', async () => {
    const { POST } = await import('./route')
    const response = await POST(request({ voterName: ' Alice ', counterProposal: ' Sushi ' }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, notification: 'not_configured' })
    const stored = JSON.parse((await inMemoryRedis.lrange(`poll:${pollId}:responses`, 0, -1))[0])
    expect(stored).toMatchObject({ voterName: 'Alice', counterProposal: 'Sushi' })
    expect(stored.votes[0]).toEqual({ text: 'Pizza', vote: 'yes', comment: '' })
  })

  it('retires tokenless legacy polls with 410 and does not mutate them', async () => {
    const { POST } = await import('./route')
    await seed({ resultsTokenHash: '' })
    const response = await POST(request())
    expect(response.status).toBe(410)
    expect(await inMemoryRedis.lrange(`poll:${pollId}:responses`, 0, -1)).toEqual([])
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('returns duplicate without claiming the prior email outcome or sending again', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('POLL_CREATOR_EMAIL', 'owner@example.com')
    const { POST } = await import('./route')
    expect(await (await POST(request())).json()).toMatchObject({ notification: 'sent' })
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL', '')
    vi.stubEnv('TRUST_PROXY', '')
    expect(await (await POST(request())).json()).toEqual({ success: true, notification: 'duplicate' })
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('keeps notification email free of poll and voter details and sets provider idempotency', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('POLL_CREATOR_EMAIL', 'owner@example.com')
    await seed({ title: 'Dinner\r\nBcc: bad@example.com <script>' })
    const { POST } = await import('./route')
    const response = await POST(request({
      voterName: 'Al\r\nBcc: bad@example.com <img src=x>',
      counterProposal: '<b>danger</b>',
      votes: [{ text: 'Pizza', vote: 'yes', comment: '<svg onload=x>' }],
    }))
    expect(response.status).toBe(200)
    const [message, options] = sendMock.mock.calls[0]
    const serialized = JSON.stringify(message)
    expect(serialized).not.toContain('bad@example.com')
    expect(serialized).not.toContain('Dinner')
    expect(serialized).not.toContain('danger')
    expect(serialized).not.toContain('Pizza')
    expect(serialized).not.toContain('svg')
    expect(serialized).not.toContain('Bcc')
    expect(options).toEqual({ idempotencyKey: `vote/${pollId}/${submissionId}` })
  })

  it('reports a resolved provider error as failed, never sent', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('POLL_CREATOR_EMAIL', 'owner@example.com')
    sendMock.mockResolvedValue({ data: null, error: { message: 'rejected' } })
    const { POST } = await import('./route')
    expect(await (await POST(request())).json()).toEqual({ success: true, notification: 'failed' })
  })

  it('fails closed in production when only spoofable proxy headers exist', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL', '')
    vi.stubEnv('TRUST_PROXY', '')
    const { POST } = await import('./route')
    const response = await POST(request({}, { 'x-forwarded-for': '203.0.113.9' }))
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('60')
    expect(await inMemoryRedis.lrange(`poll:${pollId}:responses`, 0, -1)).toEqual([])
  })

  it('never copies a payload-bearing storage error into logs', async () => {
    const storage = await import('@/lib/redis')
    vi.spyOn(storage, 'appendVoteAtomically').mockRejectedValueOnce(
      new Error('SENTINEL_PRIVATE_BALLOT Alice secret comment')
    )
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { POST } = await import('./route')

    const response = await POST(request())

    expect(response.status).toBe(500)
    expect(JSON.stringify(errorSpy.mock.calls)).toBe('[["[whatitdo] vote_submit_failed"]]')
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('SENTINEL_PRIVATE_BALLOT')
  })

  it('rejects a no-CORS-compatible text body before reading poll data', async () => {
    const { POST } = await import('./route')
    const response = await POST(new NextRequest('http://localhost/api/vote', {
      method: 'POST',
      body: JSON.stringify({ pollId, submissionId }),
      headers: { 'content-type': 'text/plain' },
    }))
    expect(response.status).toBe(415)
    expect(await response.json()).toEqual({ error: 'Content-Type must be application/json' })
  })
})
