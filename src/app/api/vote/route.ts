import { redis } from '@/lib/redis'
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
    const { pollId, voterName, votes, counterProposal } = body

    if (!pollId || !votes) {
      return NextResponse.json({ error: 'Poll ID and votes required' }, { status: 400 })
    }

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
      submittedAt: Date.now()
    }

    poll.responses.push(response)
    await redis.set(`poll:${pollId}`, JSON.stringify(poll))

    // Send email notification
    const emailClient = getResend()
    if (emailClient && poll.creatorEmail) {
      const isDubious = poll.mode === 'dubious'
      const hasYolo = votes.some((v: { vote: string }) => v.vote === 'yolo')

      const getVoteEmoji = (vote: string) => {
        if (vote === 'yes') return '✅'
        if (vote === 'no') return '❌'
        if (vote === 'maybe') return '🤔'
        if (vote === 'yolo') return '🎲'
        return ''
      }

      const voteSummary = votes.map((v: { text: string; vote: string; comment: string }, i: number) =>
        `${getVoteEmoji(v.vote)} ${i + 1}. "${v.text}"\n   Vote: ${v.vote.toUpperCase()}${v.comment ? `\n   Comment: "${v.comment}"` : ''}`
      ).join('\n\n')

      const counterProposalHtml = counterProposal
        ? `<div style="background: ${isDubious ? '#3d1f1f' : '#2d1f3d'}; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${isDubious ? '#f97316' : '#f0abfc'};">
             <p style="color: ${isDubious ? '#f97316' : '#f0abfc'}; font-weight: bold; margin: 0 0 8px 0;">${isDubious ? '🔥 Counter Dare:' : '💡 Counter Proposal:'}</p>
             <p style="color: #e2e8f0; margin: 0; font-style: italic;">"${counterProposal}"</p>
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
              <p><strong>${response.voterName}</strong> just ${isDubious ? 'responded to your dare' : 'voted on your poll'} "<strong>${poll.title}</strong>"</p>
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
                Total responses: ${poll.responses.length} ${isDubious ? '| Dubious Mode 🌶️' : ''}
              </p>
            </div>
          `
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
