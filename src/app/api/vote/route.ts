import { redis } from '@/lib/redis'
import { nanoid } from 'nanoid'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { Poll, PollResponse } from '@/lib/types'
import { escapeHtml } from '@/lib/utils'
import { z } from 'zod'

const POLL_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

const VoteSchema = z.object({
  pollId: z.string().min(1, 'Poll ID required'),
  voterName: z.string().max(100).optional(),
  votes: z
    .array(
      z.object({
        text: z.string().min(1).max(200),
        vote: z.enum(['yes', 'no', 'maybe', 'yolo']),
        comment: z.string().max(200).default(''),
      })
    )
    .min(1, 'At least one vote required')
    .max(3),
  counterProposal: z.string().max(500).optional(),
})

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
    const parsed = VoteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const { pollId, voterName, votes, counterProposal } = parsed.data

    const data = await redis.get(`poll:${pollId}`)

    if (!data) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    const poll: Poll = typeof data === 'string' ? JSON.parse(data) : data

    const response: PollResponse = {
      id: nanoid(8),
      voterName: voterName || 'Anonymous',
      votes,
      counterProposal: counterProposal || undefined,
      submittedAt: Date.now(),
    }

    poll.responses.push(response)
    await redis.set(`poll:${pollId}`, JSON.stringify(poll), { ex: POLL_TTL_SECONDS })

    // Send email notification
    const emailClient = getResend()
    if (emailClient && poll.creatorEmail) {
      const isDubious = poll.mode === 'dubious'
      const hasYolo = votes.some((v) => v.vote === 'yolo')

      const getVoteEmoji = (vote: string) => {
        if (vote === 'yes') return '✅'
        if (vote === 'no') return '❌'
        if (vote === 'maybe') return '🤔'
        if (vote === 'yolo') return '🎲'
        return ''
      }

      // Escape all user-supplied content before interpolating into HTML
      const safeVoterName = escapeHtml(response.voterName)
      const safePollTitle = escapeHtml(poll.title)

      const voteSummaryHtml = votes
        .map((v, i) => {
          const safeText = escapeHtml(v.text)
          const safeComment = v.comment ? escapeHtml(v.comment) : ''
          return `<div style="margin-bottom: 12px;">
            <span>${getVoteEmoji(v.vote)}</span>
            <strong style="color: #e2e8f0;">${i + 1}. &ldquo;${safeText}&rdquo;</strong><br/>
            <span style="color: #9ca3af;">Vote: ${v.vote.toUpperCase()}</span>
            ${safeComment ? `<br/><span style="color: #9ca3af; font-style: italic;">&ldquo;${safeComment}&rdquo;</span>` : ''}
          </div>`
        })
        .join('')

      const counterProposalHtml = counterProposal
        ? `<div style="background: ${isDubious ? '#3d1f1f' : '#2d1f3d'}; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${isDubious ? '#f97316' : '#f0abfc'};">
             <p style="color: ${isDubious ? '#f97316' : '#f0abfc'}; font-weight: bold; margin: 0 0 8px 0;">${isDubious ? '🔥 Counter Dare:' : '💡 Counter Proposal:'}</p>
             <p style="color: #e2e8f0; margin: 0; font-style: italic;">&ldquo;${escapeHtml(counterProposal)}&rdquo;</p>
           </div>`
        : ''

      const resultsUrl = `${process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin')}/results/${pollId}`

      const subjectPrefix = isDubious ? '🌶️' : '📊'
      const yoloNote = hasYolo ? ' 🎲 YOLO DETECTED!' : ''

      try {
        await emailClient.emails.send({
          from: 'What It Do <notifications@resend.dev>',
          to: poll.creatorEmail,
          subject: `${subjectPrefix} ${response.voterName} voted on: ${poll.title}${counterProposal ? ' (+counter!)' : ''}${yoloNote}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: ${isDubious ? '#f97316' : '#a855f7'};">${isDubious ? '🌶️ New Dare Response!' : '📊 New Vote Received!'}</h1>
              <p><strong>${safeVoterName}</strong> just ${isDubious ? 'responded to your dare' : 'voted on your poll'} &ldquo;<strong>${safePollTitle}</strong>&rdquo;</p>
              ${hasYolo ? '<p style="background: linear-gradient(to right, #d946ef, #ec4899); color: white; padding: 8px 16px; border-radius: 8px; display: inline-block; font-weight: bold;">🎲 They went YOLO on at least one!</p>' : ''}

              <div style="background: #1a1a2e; padding: 20px; border-radius: 12px; margin: 20px 0;">
                ${voteSummaryHtml}
              </div>

              ${counterProposalHtml}

              <p>
                <a href="${resultsUrl}" style="display: inline-block; background: linear-gradient(to right, ${isDubious ? '#f97316, #ef4444' : '#a855f7, #6366f1'}); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  View All Results
                </a>
              </p>

              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
                Total responses: ${poll.responses.length} ${isDubious ? '| Dubious Mode 🌶️' : ''}
              </p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error('Failed to send email:', emailError)
      }
    }

    return NextResponse.json({ success: true, responseId: response.id })
  } catch (error) {
    console.error('Error submitting vote:', error)
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 })
  }
}
