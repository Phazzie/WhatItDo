import { redis } from '@/lib/redis'
import { nanoid } from 'nanoid'
import { NextRequest, NextResponse } from 'next/server'
import { Poll, PollMode } from '@/lib/types'
import { z } from 'zod'

const POLL_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

const CreatePollSchema = z.object({
  title: z.string().max(100).optional(),
  suggestions: z
    .array(z.string().min(1).max(200))
    .min(1, 'At least one suggestion required')
    .max(3, 'Maximum 3 suggestions allowed'),
  mode: z.enum(['normal', 'dubious']).optional().default('normal'),
  creatorEmail: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CreatePollSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const { title, suggestions, mode, creatorEmail } = parsed.data
    const pollMode: PollMode = mode === 'dubious' ? 'dubious' : 'normal'

    const id = nanoid(10)
    const poll: Poll = {
      id,
      title: title || (pollMode === 'dubious' ? 'I Dare You...' : 'What It Do?'),
      suggestions,
      creatorEmail: creatorEmail || process.env.POLL_CREATOR_EMAIL || '',
      createdAt: Date.now(),
      responses: [],
      mode: pollMode,
    }

    await redis.set(`poll:${id}`, JSON.stringify(poll), { ex: POLL_TTL_SECONDS })

    return NextResponse.json({ id, poll })
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

    const data = await redis.get(`poll:${id}`)

    if (!data) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    const poll = typeof data === 'string' ? JSON.parse(data) : data

    return NextResponse.json({ poll })
  } catch (error) {
    console.error('Error fetching poll:', error)
    return NextResponse.json({ error: 'Failed to fetch poll' }, { status: 500 })
  }
}
