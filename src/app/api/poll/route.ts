import { redis } from '@/lib/redis'
import { nanoid } from 'nanoid'
import { NextRequest, NextResponse } from 'next/server'
import { Poll, PollMode } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, suggestions, mode } = body

    if (!suggestions || suggestions.length === 0) {
      return NextResponse.json({ error: 'At least one suggestion required' }, { status: 400 })
    }

    const id = nanoid(10)
    const pollMode: PollMode = mode === 'dubious' ? 'dubious' : 'normal'
    const poll: Poll = {
      id,
      title: title || (pollMode === 'dubious' ? 'I Dare You...' : 'What It Do?'),
      suggestions,
      creatorEmail: 'sailorbeefalo@gmail.com',
      createdAt: Date.now(),
      responses: [],
      mode: pollMode
    }

    await redis.set(`poll:${id}`, JSON.stringify(poll))

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
