/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock the Redis module before importing anything else
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
  },
}))

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'testpollid01'),
}))

// Import after mocks are set up
import { POST, GET } from '@/app/api/poll/route'
import { redis } from '@/lib/redis'

const mockRedis = redis as {
  get: jest.MockedFunction<typeof redis.get>
  set: jest.MockedFunction<typeof redis.set>
}

function makePostRequest(body: unknown) {
  return new NextRequest('http://localhost/api/poll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeGetRequest(id?: string) {
  const url = id
    ? `http://localhost/api/poll?id=${id}`
    : 'http://localhost/api/poll'
  return new NextRequest(url, { method: 'GET' })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRedis.set.mockResolvedValue('OK')
})

describe('POST /api/poll', () => {
  it('creates a poll with valid input and returns an id', async () => {
    const req = makePostRequest({
      title: 'Test Poll',
      suggestions: ['Do the thing'],
      mode: 'normal',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe('testpollid01')
    expect(json.poll.title).toBe('Test Poll')
    expect(json.poll.suggestions).toEqual(['Do the thing'])
    expect(json.poll.mode).toBe('normal')
    expect(mockRedis.set).toHaveBeenCalledTimes(1)
  })

  it('returns 400 when suggestions array is empty', async () => {
    const req = makePostRequest({ suggestions: [] })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeTruthy()
  })

  it('returns 400 when suggestions are missing', async () => {
    const req = makePostRequest({ title: 'No suggestions' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when more than 3 suggestions are provided', async () => {
    const req = makePostRequest({
      suggestions: ['A', 'B', 'C', 'D'],
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('uses env var POLL_CREATOR_EMAIL when no creatorEmail in body', async () => {
    process.env.POLL_CREATOR_EMAIL = 'env@example.com'
    const req = makePostRequest({ suggestions: ['Something'] })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.poll.creatorEmail).toBe('env@example.com')
    delete process.env.POLL_CREATOR_EMAIL
  })

  it('uses provided creatorEmail over env var', async () => {
    process.env.POLL_CREATOR_EMAIL = 'env@example.com'
    const req = makePostRequest({
      suggestions: ['Something'],
      creatorEmail: 'user@example.com',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.poll.creatorEmail).toBe('user@example.com')
    delete process.env.POLL_CREATOR_EMAIL
  })

  it('returns 400 for invalid email format', async () => {
    const req = makePostRequest({
      suggestions: ['Something'],
      creatorEmail: 'not-an-email',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('defaults mode to normal when not provided', async () => {
    const req = makePostRequest({ suggestions: ['Something'] })
    const res = await POST(req)
    const json = await res.json()
    expect(json.poll.mode).toBe('normal')
  })

  it('accepts dubious mode', async () => {
    const req = makePostRequest({ suggestions: ['Something'], mode: 'dubious' })
    const res = await POST(req)
    const json = await res.json()
    expect(json.poll.mode).toBe('dubious')
  })

  it('returns 500 when Redis throws', async () => {
    mockRedis.set.mockRejectedValue(new Error('Redis connection failed'))
    const req = makePostRequest({ suggestions: ['Something'] })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})

describe('GET /api/poll', () => {
  it('returns 400 when no id is provided', async () => {
    const req = makeGetRequest()
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when poll does not exist', async () => {
    mockRedis.get.mockResolvedValue(null)
    const req = makeGetRequest('nonexistent')
    const res = await GET(req)
    expect(res.status).toBe(404)
  })

  it('returns the poll when it exists', async () => {
    const fakePoll = {
      id: 'abc123',
      title: 'Test',
      suggestions: ['Option A'],
      mode: 'normal',
      responses: [],
      creatorEmail: '',
      createdAt: Date.now(),
    }
    mockRedis.get.mockResolvedValue(JSON.stringify(fakePoll))
    const req = makeGetRequest('abc123')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.poll.id).toBe('abc123')
  })

  it('returns 500 when Redis throws', async () => {
    mockRedis.get.mockRejectedValue(new Error('Redis error'))
    const req = makeGetRequest('someid')
    const res = await GET(req)
    expect(res.status).toBe(500)
  })
})
