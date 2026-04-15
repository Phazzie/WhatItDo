/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
  },
}))

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'resp0001'),
}))

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'email-sent-id' }),
    },
  })),
}))

import { POST } from '@/app/api/vote/route'
import { redis } from '@/lib/redis'

const mockRedis = redis as {
  get: jest.MockedFunction<typeof redis.get>
  set: jest.MockedFunction<typeof redis.set>
}

const basePoll = {
  id: 'poll1234',
  title: 'Test Poll',
  suggestions: ['Go hiking'],
  mode: 'normal',
  responses: [],
  creatorEmail: 'creator@example.com',
  createdAt: Date.now(),
}

function makePostRequest(body: unknown) {
  return new NextRequest('http://localhost/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRedis.set.mockResolvedValue('OK')
})

describe('POST /api/vote', () => {
  it('submits a valid vote and returns success', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify(basePoll))
    const req = makePostRequest({
      pollId: 'poll1234',
      voterName: 'Alice',
      votes: [{ text: 'Go hiking', vote: 'yes', comment: 'Sounds great!' }],
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.responseId).toBe('resp0001')
  })

  it('returns 400 when pollId is missing', async () => {
    const req = makePostRequest({
      voterName: 'Alice',
      votes: [{ text: 'Go hiking', vote: 'yes', comment: '' }],
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when votes array is empty', async () => {
    const req = makePostRequest({ pollId: 'poll1234', votes: [] })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid vote option', async () => {
    const req = makePostRequest({
      pollId: 'poll1234',
      votes: [{ text: 'Go hiking', vote: 'definitely', comment: '' }],
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when comment exceeds 200 chars', async () => {
    const req = makePostRequest({
      pollId: 'poll1234',
      votes: [{ text: 'Go hiking', vote: 'yes', comment: 'x'.repeat(201) }],
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when counterProposal exceeds 500 chars', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify(basePoll))
    const req = makePostRequest({
      pollId: 'poll1234',
      votes: [{ text: 'Go hiking', vote: 'yes', comment: '' }],
      counterProposal: 'x'.repeat(501),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when poll is not found', async () => {
    mockRedis.get.mockResolvedValue(null)
    const req = makePostRequest({
      pollId: 'nonexistent',
      votes: [{ text: 'Go hiking', vote: 'yes', comment: '' }],
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('accepts yolo vote in dubious mode poll', async () => {
    const dubiousPoll = { ...basePoll, mode: 'dubious' }
    mockRedis.get.mockResolvedValue(JSON.stringify(dubiousPoll))
    const req = makePostRequest({
      pollId: 'poll1234',
      voterName: 'Bold Person',
      votes: [{ text: 'Go hiking', vote: 'yolo', comment: '' }],
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('stores Anonymous when voterName is not provided', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify(basePoll))
    const req = makePostRequest({
      pollId: 'poll1234',
      votes: [{ text: 'Go hiking', vote: 'no', comment: '' }],
    })
    await POST(req)
    const savedPoll = JSON.parse((mockRedis.set as jest.Mock).mock.calls[0][1])
    expect(savedPoll.responses[0].voterName).toBe('Anonymous')
  })

  it('returns 500 when Redis throws', async () => {
    mockRedis.get.mockRejectedValue(new Error('Redis down'))
    const req = makePostRequest({
      pollId: 'poll1234',
      votes: [{ text: 'Go hiking', vote: 'yes', comment: '' }],
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
