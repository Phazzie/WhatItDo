import { kv } from '@vercel/kv'
import { nanoid } from 'nanoid'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { Poll, PollResponse } from '@/lib/types'

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pollId, voterName, votes } = body

    if (!pollId || !votes) {
      return NextResponse.json({ error: 'Poll ID and votes required' }, { status: 400 })
    }

    const poll = await kv.get<Poll>(`poll:${pollId}`)

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    const response: PollResponse = {
      id: nanoid(8),
      voterName: voterName || 'Anonymous',
      votes,
      submittedAt: Date.now()
    }

    poll.responses.push(response)
    await kv.set(`poll:${pollId}`, poll)

    // Send email notification
    const emailClient = getResend()
    if (emailClient && poll.creatorEmail) {
      const voteSummary = votes.map((v: { text: string; vote: string; comment: string }, i: number) =>
        `${i + 1}. "${v.text}"\n   Vote: ${v.vote.toUpperCase()}${v.comment ? `\n   Comment: "${v.comment}"` : ''}`
      ).join('\n\n')

      const resultsUrl = `${process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin')}/results/${pollId}`

      try {
        await emailClient.emails.send({
          from: 'What It Do <notifications@resend.dev>',
          to: poll.creatorEmail,
          subject: `${response.voterName} voted on your poll: ${poll.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #a855f7;">New Vote Received!</h1>
              <p><strong>${response.voterName}</strong> just voted on your poll "<strong>${poll.title}</strong>"</p>

              <div style="background: #1a1a2e; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <pre style="color: #e2e8f0; white-space: pre-wrap; font-size: 14px;">${voteSummary}</pre>
              </div>

              <p>
                <a href="${resultsUrl}" style="display: inline-block; background: linear-gradient(to right, #a855f7, #6366f1); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  View All Results
                </a>
              </p>

              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
                Total responses: ${poll.responses.length}
              </p>
            </div>
          `
        })
      } catch (emailError) {
        console.error('Failed to send email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true, responseId: response.id })
  } catch (error) {
    console.error('Error submitting vote:', error)
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 })
  }
}
