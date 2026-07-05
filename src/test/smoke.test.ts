import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { mockRedis } from './mockRedis'
import type { Poll } from '@/lib/types'

vi.mock('@/lib/redis', () => ({ redis: mockRedis }))

describe('smoke', () => {
  it('true is true', () => {
    expect(true).toBe(true)
  })
})

describe('GET /api/poll', () => {
  beforeEach(() => {
    mockRedis.reset()
  })

  it('returns a previously seeded poll', async () => {
    const { GET } = await import('@/app/api/poll/route')

    const poll: Poll = {
      id: 'poll123',
      title: 'What It Do?',
      suggestions: ['Pizza', 'Tacos'],
      creatorEmail: 'creator@example.com',
      createdAt: Date.now(),
      responses: [],
      mode: 'normal',
    }
    await mockRedis.set(`poll:${poll.id}`, JSON.stringify(poll))

    const request = new NextRequest(`http://localhost/api/poll?id=${poll.id}`)
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.poll).toMatchObject({
      id: poll.id,
      title: poll.title,
      suggestions: poll.suggestions,
    })
  })

  it('returns 400 when id is missing', async () => {
    const { GET } = await import('@/app/api/poll/route')

    const request = new NextRequest('http://localhost/api/poll')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBeTruthy()
  })
})
