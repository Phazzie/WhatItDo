import { redis, POLL_TTL_SECONDS, checkRateLimit, getClientIp } from '@/lib/redis'
import { nanoid } from 'nanoid'
import { NextRequest, NextResponse } from 'next/server'
import { Poll, PollMode, PollResponse } from '@/lib/types'
import { validatePollInput, isValidPollId } from '@/lib/validation'

const POLL_RATE_LIMIT = 10
const POLL_RATE_WINDOW_SECONDS = 60 * 60

// creatorEmail is the deployer's private notification address — it lives in
// Redis for the vote route's email sending but must never reach clients, who
// only need the poll content (anyone with the share link can read this JSON).
function toPublicPoll(poll: Poll): Omit<Poll, 'creatorEmail'> {
  const { creatorEmail: _creatorEmail, ...publicPoll } = poll
  return publicPoll
}

export async function POST(request: NextRequest) {
  try {
    if (process.env.RATE_LIMIT_ENABLED === '1') {
      const ip = getClientIp(request)
      if (ip) {
        const allowed = await checkRateLimit(`ratelimit:poll:${ip}`, POLL_RATE_LIMIT, POLL_RATE_WINDOW_SECONDS)
        if (!allowed) {
          return NextResponse.json({ error: 'Too many polls created. Please try again later.' }, { status: 429 })
        }
      }
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const validation = validatePollInput(body)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { title, suggestions, mode } = body as { title?: string; suggestions: string[]; mode?: string }

    const id = nanoid(10)
    const pollMode: PollMode = mode === 'dubious' ? 'dubious' : 'normal'
    const poll: Poll = {
      id,
      title: title || (pollMode === 'dubious' ? 'I Dare You...' : 'What It Do?'),
      suggestions,
      creatorEmail: process.env.POLL_CREATOR_EMAIL || '',
      createdAt: Date.now(),
      responses: [],
      mode: pollMode
    }

    await redis.set(`poll:${id}`, JSON.stringify(poll), { ex: POLL_TTL_SECONDS })

    return NextResponse.json({ id, poll: toPublicPoll(poll) })
  } catch (error) {
    console.error('Error creating poll:', error)
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Poll ID required' }, { status: 400 })
    }

    if (!isValidPollId(id)) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    const data = await redis.get(`poll:${id}`)

    if (!data) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    const poll: Poll = typeof data === 'string' ? JSON.parse(data) : data

    const rawResponses = await redis.lrange(`poll:${id}:responses`, 0, -1)
    const responses: PollResponse[] = rawResponses.map((r) => (typeof r === 'string' ? JSON.parse(r) : r))
    poll.responses = responses

    return NextResponse.json({ poll: toPublicPoll(poll) })
  } catch (error) {
    console.error('Error fetching poll:', error)
    return NextResponse.json({ error: 'Failed to fetch poll' }, { status: 500 })
  }
}
