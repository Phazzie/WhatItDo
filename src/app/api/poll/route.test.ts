import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { inMemoryRedis } from '@/lib/inMemoryRedis'
import * as redis from '@/lib/redis'
import { POLL_IDLE_TTL_SECONDS, resetRedisForTests } from '@/lib/redis'

function post(body: unknown) {
  return new NextRequest('http://localhost/api/poll', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

describe('/api/poll public privacy contract', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    resetRedisForTests()
  })

  it('creates a poll with an independent token but exposes exactly the PublicPoll keys', async () => {
    const { POST } = await import('./route')
    const response = await POST(post({ title: ' Dinner? ', suggestions: [' Pizza ', 'Tacos'], mode: 'normal' }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.id).toMatch(/^[A-Za-z0-9_-]{10}$/)
    expect(json.resultsToken).toMatch(/^[A-Za-z0-9_-]{24}$/)
    expect(Object.keys(json.poll).sort()).toEqual(['mode', 'suggestions', 'title'])
    expect(json.poll).toEqual({ title: 'Dinner?', mode: 'normal', suggestions: ['Pizza', 'Tacos'] })

    const storedRaw = await inMemoryRedis.get<string>(`poll:${json.id}`)
    const stored = JSON.parse(storedRaw as string)
    expect(stored.resultsTokenHash).toMatch(/^[a-f0-9]{64}$/)
    expect(stored.resultsTokenHash).not.toBe(json.resultsToken)
    expect(stored).not.toHaveProperty('creatorEmail')
    expect(stored).not.toHaveProperty('responses')
    expect(inMemoryRedis.getTtl(`poll:${json.id}`)).toBeLessThanOrEqual(POLL_IDLE_TTL_SECONDS)
    expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0')
  })

  it('charges the create rate once and retries a colliding namespace with fresh credentials', async () => {
    const rateSpy = vi.spyOn(redis, 'checkPollCreateRateLimit')
    const createSpy = vi.spyOn(redis, 'createPollAtomically')
      .mockResolvedValueOnce({ status: 'namespace_conflict' })
      .mockResolvedValueOnce({ status: 'created' })
    const { POST } = await import('./route')

    const response = await POST(post({ suggestions: ['A'], mode: 'normal' }))
    const json = await response.json()
    const attemptedPolls = createSpy.mock.calls.map(([poll]) => poll)

    expect(response.status).toBe(200)
    expect(rateSpy).toHaveBeenCalledTimes(1)
    expect(createSpy).toHaveBeenCalledTimes(2)
    expect(attemptedPolls[0].id).not.toBe(attemptedPolls[1].id)
    expect(attemptedPolls[0].resultsTokenHash).not.toBe(attemptedPolls[1].resultsTokenHash)
    expect(json.id).toBe(attemptedPolls[1].id)
  })

  it('stops after three namespace collisions without spending another rate attempt', async () => {
    const rateSpy = vi.spyOn(redis, 'checkPollCreateRateLimit')
    const createSpy = vi.spyOn(redis, 'createPollAtomically')
      .mockResolvedValue({ status: 'namespace_conflict' })
    const { POST } = await import('./route')

    const response = await POST(post({ suggestions: ['A'], mode: 'normal' }))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Failed to create poll' })
    expect(rateSpy).toHaveBeenCalledTimes(1)
    expect(createSpy).toHaveBeenCalledTimes(3)
    const attemptedPolls = createSpy.mock.calls.map(([poll]) => poll)
    expect(new Set(attemptedPolls.map((poll) => poll.id)).size).toBe(3)
    expect(new Set(attemptedPolls.map((poll) => poll.resultsTokenHash)).size).toBe(3)
  })

  it('GET returns exactly title/mode/suggestions with no-store', async () => {
    const { GET, POST } = await import('./route')
    const created = await (await POST(post({ suggestions: ['A'], mode: 'dubious' }))).json()
    const response = await GET(new NextRequest(`http://localhost/api/poll?id=${created.id}`))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(Object.keys(json.poll).sort()).toEqual(['mode', 'suggestions', 'title'])
    expect(JSON.stringify(json)).not.toContain(created.id)
    expect(JSON.stringify(json)).not.toContain(created.resultsToken)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('retires tokenless legacy polls with 410 instead of exposing embedded responses', async () => {
    const { GET } = await import('./route')
    await inMemoryRedis.set('poll:legacy0001', JSON.stringify({
      id: 'legacy0001', title: 'Old', suggestions: ['A'], mode: 'normal', createdAt: Date.now(),
      responses: [{ id: 'secret', voterName: 'Private person' }],
    }))
    const response = await GET(new NextRequest('http://localhost/api/poll?id=legacy0001'))
    expect(response.status).toBe(410)
    expect(JSON.stringify(await response.json())).not.toContain('Private person')
  })

  it('rejects malformed and oversized requests without a 500', async () => {
    const { POST } = await import('./route')
    expect((await POST(post('{not-json'))).status).toBe(400)
    expect((await POST(post('x'.repeat(16 * 1024 + 1)))).status).toBe(413)
  })

  it('rejects no-CORS-compatible text bodies before creating a poll', async () => {
    const { POST } = await import('./route')
    const response = await POST(new NextRequest('http://localhost/api/poll', {
      method: 'POST',
      body: JSON.stringify({ suggestions: ['Orphan me'], mode: 'normal' }),
      headers: { 'content-type': 'text/plain' },
    }))
    expect(response.status).toBe(415)
    expect(await response.json()).toEqual({ error: 'Content-Type must be application/json' })
  })
})
