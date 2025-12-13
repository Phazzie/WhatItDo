import { kv } from '@vercel/kv'
import { nanoid } from 'nanoid'
import { NextRequest, NextResponse } from 'next/server'
import { Poll } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, suggestions, creatorEmail } = body

    if (!suggestions || suggestions.length === 0) {
      return NextResponse.json({ error: 'At least one suggestion required' }, { status: 400 })
    }

    if (!creatorEmail) {
      return NextResponse.json({ error: 'Email required for notifications' }, { status: 400 })
    }

    const id = nanoid(10)
    const poll: Poll = {
      id,
      title: title || 'What It Do?',
      suggestions,
      creatorEmail,
      createdAt: Date.now(),
      responses: []
    }

    await kv.set(`poll:${id}`, poll)

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

    const poll = await kv.get<Poll>(`poll:${id}`)

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    return NextResponse.json({ poll })
  } catch (error) {
    console.error('Error fetching poll:', error)
    return NextResponse.json({ error: 'Failed to fetch poll' }, { status: 500 })
  }
}
