import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { inMemoryRedis } from '@/lib/inMemoryRedis'
import { resetRedisForTests } from '@/lib/redis'
import { hashResultsToken } from '@/lib/resultsToken'
import type { StoredPoll, StoredPollResponse } from '@/lib/types'

const pollId = 'result0001'
const token = 'A_-bcdefghijklmnopqrstuv'

function post(resultsToken = token) {
  return new NextRequest('http://localhost/api/results', {
    method: 'POST',
    body: JSON.stringify({ pollId, resultsToken }),
    headers: { 'content-type': 'application/json' },
  })
}

async function seed() {
  const now = Date.now()
  const poll: StoredPoll = {
    id: pollId, title: 'Secret tally', suggestions: ['A'], mode: 'normal', createdAt: now,
    expiresAt: now + 60_000, resultsTokenHash: hashResultsToken(token),
  }
  const response: StoredPollResponse = {
    id: 'response-secret-id', voterName: 'Alice', votes: [{ text: 'A', vote: 'yes', comment: 'ok' }], submittedAt: now,
  }
  await inMemoryRedis.set(`poll:${pollId}`, JSON.stringify(poll))
  await inMemoryRedis.rpush(`poll:${pollId}:responses`, JSON.stringify(response))
}

describe('POST /api/results', () => {
  beforeEach(async () => {
    vi.unstubAllEnvs()
    resetRedisForTests()
    await seed()
  })

  it('returns 404 for a wrong but well-formed token', async () => {
    const { POST } = await import('./route')
    const response = await POST(post('Z_-bcdefghijklmnopqrstuv'))
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Poll not found' })
  })

  it('retires a tokenless legacy poll without disclosing its response list', async () => {
    const { POST } = await import('./route')
    const raw = await inMemoryRedis.get<string>(`poll:${pollId}`)
    await inMemoryRedis.set(`poll:${pollId}`, JSON.stringify({ ...JSON.parse(raw as string), resultsTokenHash: '' }))
    const response = await POST(post())
    expect(response.status).toBe(410)
    expect(JSON.stringify(await response.json())).not.toContain('Alice')
  })

  it('returns private owner data without poll or response identifiers', async () => {
    const { POST } = await import('./route')
    const response = await POST(post())
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0')
    expect(response.headers.get('referrer-policy')).toBe('no-referrer')
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(Object.keys(json.poll).sort()).toEqual(['createdAt', 'expiresAt', 'mode', 'responses', 'suggestions', 'title'])
    expect(json.poll.responses[0]).not.toHaveProperty('id')
    expect(JSON.stringify(json)).not.toContain(pollId)
    expect(JSON.stringify(json)).not.toContain('response-secret-id')
    expect(JSON.stringify(json)).not.toContain(token)
  })

  it('does not replay an authorized response into a later unauthorized request', async () => {
    const { POST } = await import('./route')
    expect((await POST(post())).status).toBe(200)
    const denied = await POST(post('Z_-bcdefghijklmnopqrstuv'))
    expect(denied.status).toBe(404)
    expect(JSON.stringify(await denied.json())).not.toContain('Alice')
  })

  it('applies private headers even to malformed credential requests', async () => {
    const { POST } = await import('./route')
    const response = await POST(post('short'))
    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(response.headers.get('x-robots-tag')).toContain('noindex')
  })

  it('rejects a no-CORS-compatible text body with private headers', async () => {
    const { POST } = await import('./route')
    const response = await POST(new NextRequest('http://localhost/api/results', {
      method: 'POST',
      body: JSON.stringify({ pollId, resultsToken: token }),
      headers: { 'content-type': 'text/plain' },
    }))
    expect(response.status).toBe(415)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(await response.json()).toEqual({ error: 'Content-Type must be application/json' })
  })
})
