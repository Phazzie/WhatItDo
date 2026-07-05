import { redis, POLL_TTL_SECONDS, checkRateLimit, getClientIp } from '@/lib/redis'
import { nanoid } from 'nanoid'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { Poll, PollResponse } from '@/lib/types'
import { validateVoteInput } from '@/lib/validation'
import { escapeHtml } from '@/lib/escapeHtml'
import { getVoteEmoji } from '@/lib/voteDisplay'

const VOTE_RATE_LIMIT = 20
const VOTE_RATE_WINDOW_SECONDS = 60 * 60

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
    if (process.env.RATE_LIMIT_ENABLED === '1') {
      const ip = getClientIp(request)
      const allowed = await checkRateLimit(`ratelimit:vote:${ip}`, VOTE_RATE_LIMIT, VOTE_RATE_WINDOW_SECONDS)
      if (!allowed) {
        return NextResponse.json({ error: 'Too many votes submitted. Please try again later.' }, { status: 429 })
      }
    }

    let body: { pollId?: string; voterName?: string; votes?: unknown; counterProposal?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const { pollId, voterName, votes, counterProposal } = body

    if (!pollId || !votes) {
      return NextResponse.json({ error: 'Poll ID and votes required' }, { status: 400 })
    }

    const data = await redis.get(`poll:${pollId}`)

    if (!data) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    const poll: Poll = typeof data === 'string' ? JSON.parse(data) : data

    const validation = validateVoteInput(body, poll)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Rebuild the votes from scratch rather than persisting the raw request
    // objects — a direct API caller could otherwise attach arbitrary extra
    // fields that get stored and served back from GET /api/poll.
    const typedVotes: PollResponse['votes'] = (votes as PollResponse['votes']).map((v) => ({
      text: v.text,
      vote: v.vote,
      comment: typeof v.comment === 'string' ? v.comment : ''
    }))

    const response: PollResponse = {
      id: nanoid(8),
      voterName: voterName || 'Anonymous',
      votes: typedVotes,
      counterProposal: counterProposal || undefined,
      submittedAt: Date.now()
    }

    const responseCount = await redis.rpush(`poll:${pollId}:responses`, JSON.stringify(response))

    // Refresh the 30-day TTL on both keys on every vote so active polls
    // don't expire out from under their responses (H2).
    await redis.expire(`poll:${pollId}`, POLL_TTL_SECONDS)
    await redis.expire(`poll:${pollId}:responses`, POLL_TTL_SECONDS)

    // Send email notification
    const emailClient = getResend()
    if (emailClient && poll.creatorEmail) {
      const isDubious = poll.mode === 'dubious'
      const hasYolo = typedVotes.some((v) => v.vote === 'yolo')

      const voteSummary = typedVotes.map((v, i) =>
        `${getVoteEmoji(v.vote)} ${i + 1}. "${escapeHtml(v.text)}"\n   Vote: ${v.vote.toUpperCase()}${v.comment ? `\n   Comment: "${escapeHtml(v.comment)}"` : ''}`
      ).join('\n\n')

      const counterProposalHtml = counterProposal
        ? `<div style="background: ${isDubious ? '#3d1f1f' : '#2d1f3d'}; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${isDubious ? '#f97316' : '#f0abfc'};">
             <p style="color: ${isDubious ? '#f97316' : '#f0abfc'}; font-weight: bold; margin: 0 0 8px 0;">${isDubious ? '🔥 Counter Dare:' : '💡 Counter Proposal:'}</p>
             <p style="color: #e2e8f0; margin: 0; font-style: italic;">"${escapeHtml(counterProposal)}"</p>
           </div>`
        : ''

      const resultsUrl = `${process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin}/results/${pollId}`

      const subjectPrefix = isDubious ? '🌶️' : '📊'
      const yoloNote = hasYolo ? ' 🎲 YOLO DETECTED!' : ''
      const escapedVoterName = escapeHtml(response.voterName)
      const escapedTitle = escapeHtml(poll.title)

      try {
        await emailClient.emails.send({
          from: process.env.EMAIL_FROM || 'What It Do <notifications@resend.dev>',
          to: poll.creatorEmail,
          subject: `${subjectPrefix} ${response.voterName} voted on: ${poll.title}${counterProposal ? ' (+counter!)' : ''}${yoloNote}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: ${isDubious ? '#f97316' : '#a855f7'};">${isDubious ? '🌶️ New Dare Response!' : '📊 New Vote Received!'}</h1>
              <p><strong>${escapedVoterName}</strong> just ${isDubious ? 'responded to your dare' : 'voted on your poll'} "<strong>${escapedTitle}</strong>"</p>
              ${hasYolo ? '<p style="background: linear-gradient(to right, #d946ef, #ec4899); color: white; padding: 8px 16px; border-radius: 8px; display: inline-block; font-weight: bold;">🎲 They went YOLO on at least one!</p>' : ''}

              <div style="background: #1a1a2e; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <pre style="color: #e2e8f0; white-space: pre-wrap; font-size: 14px;">${voteSummary}</pre>
              </div>

              ${counterProposalHtml}

              <p>
                <a href="${resultsUrl}" style="display: inline-block; background: linear-gradient(to right, ${isDubious ? '#f97316, #ef4444' : '#a855f7, #6366f1'}); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  View All Results
                </a>
              </p>

              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
                Total responses: ${responseCount} ${isDubious ? '| Dubious Mode 🌶️' : ''}
              </p>
            </div>
          `
        })
      } catch (emailError) {
        console.error('Failed to send email:', emailError)
      }
    } else if (emailClient && !poll.creatorEmail) {
      console.log(`No creator email configured for poll ${pollId}; skipping notification email`)
    }

    return NextResponse.json({ success: true, responseId: response.id })
  } catch (error) {
    console.error('Error submitting vote:', error)
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 })
  }
}
