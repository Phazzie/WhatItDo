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

function configureEmail() {
  vi.stubEnv('RESEND_API_KEY', 'test-key')
  vi.stubEnv('POLL_CREATOR_EMAIL', 'owner@example.com')
  vi.stubEnv('EMAIL_FROM', 'What It Do <notifications@example.com>')
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
    vi.useRealTimers()
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

  it('treats a missing verified sender as not configured without calling Resend', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('POLL_CREATOR_EMAIL', 'owner@example.com')
    const { POST } = await import('./route')

    const response = await POST(request())

    expect(await response.json()).toEqual({ success: true, notification: 'not_configured' })
    expect(sendMock).not.toHaveBeenCalled()
    expect(await inMemoryRedis.lrange(`poll:${pollId}:responses`, 0, -1)).toHaveLength(1)
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
    configureEmail()
    const { POST } = await import('./route')
    expect(await (await POST(request())).json()).toMatchObject({ notification: 'sent' })
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL', '')
    vi.stubEnv('TRUST_PROXY', '')
    expect(await (await POST(request())).json()).toEqual({ success: true, notification: 'duplicate' })
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('treats a normalization-equivalent retry as the same ballot', async () => {
    configureEmail()
    const { POST } = await import('./route')

    expect(await (await POST(request({
      voterName: ' Alice ',
      votes: [{ text: ' Pizza ', vote: 'yes', comment: ' Fine ' }],
      counterProposal: ' Tacos ',
    }))).json()).toMatchObject({ notification: 'sent' })
    expect(await (await POST(request({
      voterName: 'Alice',
      votes: [{ text: 'Pizza', vote: 'yes', comment: 'Fine' }],
      counterProposal: 'Tacos',
    }))).json()).toEqual({ success: true, notification: 'duplicate' })
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('rejects reuse of a submission ID for a changed ballot without mutation or email', async () => {
    configureEmail()
    const { POST } = await import('./route')
    expect((await POST(request())).status).toBe(200)

    const conflict = await POST(request({
      voterName: 'Edited voter',
      votes: [{ text: 'Pizza', vote: 'no', comment: 'Changed' }],
    }))

    expect(conflict.status).toBe(409)
    expect(await conflict.json()).toEqual({
      error: 'Submission ID was already used for a different ballot',
      code: 'SUBMISSION_CONFLICT',
    })
    expect(await inMemoryRedis.lrange(`poll:${pollId}:responses`, 0, -1)).toHaveLength(1)
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('fails legacy plain receipts closed before identity checks, mutation, or email', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL', '')
    vi.stubEnv('TRUST_PROXY', '')
    await inMemoryRedis.hset(`poll:${pollId}:submissions`, submissionId, 'legacy-response-id')
    const { POST } = await import('./route')

    const response = await POST(request())

    expect(response.status).toBe(409)
    expect(await inMemoryRedis.lrange(`poll:${pollId}:responses`, 0, -1)).toEqual([])
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('sends escaped ballot details without private credentials or internal IDs', async () => {
    configureEmail()
    vi.stubEnv('EMAIL_FROM', 'What It Do\r\nBcc: injected@example.com <notifications@example.com>')
    await seed({
      title: 'Dinner\r\nBcc: bad@example.com <script>',
      resultsTokenHash: 'private-results-hash-sentinel',
    })
    const { POST } = await import('./route')
    const response = await POST(request({
      voterName: 'Al\r\nBcc: bad@example.com <img src=x>',
      counterProposal: '<b>danger</b>',
      votes: [{ text: 'Pizza', vote: 'yes', comment: '<svg onload=x>' }],
    }))
    expect(response.status).toBe(200)
    const [message, options] = sendMock.mock.calls[0]
    const html = String(message.html)
    const stored = JSON.parse((await inMemoryRedis.lrange(`poll:${pollId}:responses`, 0, -1))[0])

    expect(message).toMatchObject({
      from: 'What It Do Bcc: injected@example.com <notifications@example.com>',
      to: 'owner@example.com',
      subject: 'A What It Do poll received a response',
    })
    expect(String(message.from)).not.toMatch(/[\r\n]/)
    expect(String(message.subject)).not.toMatch(/[\r\n]/)
    expect(html).toContain('Dinner\r\nBcc: bad@example.com &lt;script&gt;')
    expect(html).toContain('Al\r\nBcc: bad@example.com &lt;img src=x&gt;')
    expect(html).toContain('<strong>Pizza</strong>: yes')
    expect(html).toContain('Note: &lt;svg onload=x&gt;')
    expect(html).toContain('Counterproposal:</strong> &lt;b&gt;danger&lt;/b&gt;')
    expect(html).not.toMatch(/<(?:script|img|svg|b)(?:\s|>)/i)
    expect(html).not.toContain('owner@example.com')
    expect(html).not.toContain(pollId)
    expect(html).not.toContain(submissionId)
    expect(html).not.toContain(stored.id)
    expect(html).not.toContain('private-results-hash-sentinel')
    expect(options).toEqual({ idempotencyKey: submissionId })
  })

  it('bounds the provider wait at five seconds without undoing the recorded vote', async () => {
    vi.useFakeTimers()
    configureEmail()
    let markStarted: () => void = () => undefined
    const started = new Promise<void>((resolve) => {
      markStarted = resolve
    })
    sendMock.mockImplementation(() => {
      markStarted()
      return new Promise(() => undefined)
    })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { POST } = await import('./route')

    const pending = POST(request())
    await started
    await vi.advanceTimersByTimeAsync(5_000)
    const response = await pending

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, notification: 'failed' })
    expect(await inMemoryRedis.lrange(`poll:${pollId}:responses`, 0, -1)).toHaveLength(1)
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls).toEqual([['[whatitdo] vote_notification_failed']])
  })

  it('reports a resolved provider error as failed, never sent', async () => {
    configureEmail()
    sendMock.mockResolvedValue({ data: null, error: { message: 'rejected' } })
    const { POST } = await import('./route')
    expect(await (await POST(request())).json()).toEqual({ success: true, notification: 'failed' })
  })

  it('returns a stable terminal code when the poll reaches capacity', async () => {
    const storage = await import('@/lib/redis')
    vi.spyOn(storage, 'appendVoteAtomically').mockResolvedValueOnce({ status: 'capacity_reached' })
    const { POST } = await import('./route')

    const response = await POST(request())

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: 'This poll has reached its response limit',
      code: 'POLL_FULL',
    })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('returns a stable terminal code when the poll expires during submission', async () => {
    const storage = await import('@/lib/redis')
    vi.spyOn(storage, 'appendVoteAtomically').mockResolvedValueOnce({ status: 'expired' })
    const { POST } = await import('./route')

    const response = await POST(request())

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Poll not found', code: 'POLL_UNAVAILABLE' })
    expect(sendMock).not.toHaveBeenCalled()
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
