import * as storageModule from '@/lib/redis'
import { sanitizeHeaderValue } from '@/lib/escapeHtml'
import { readJsonBody } from '@/lib/requestBody'
import type { NotificationStatus, StoredPoll, StoredPollResponse } from '@/lib/types'
import { isValidPollId, parseVoteInput } from '@/lib/validation'
import { nanoid } from 'nanoid'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

type RedisReader = { get<T = unknown>(key: string): Promise<T | null> }
type AppendResult = {
  status: 'appended' | 'duplicate' | 'not_found' | 'expired' | 'identity_unavailable' | 'capacity_reached' | 'rate_limited'
  responseId?: string
  responseCount?: number
  retryAfterSeconds?: number
  scope?: 'ip' | 'poll'
}
type StorageContract = {
  getRedis(): RedisReader
  resolveClientIp(request: NextRequest):
    | { status: 'resolved'; ip: string }
    | { status: 'unavailable'; reason: 'missing' | 'untrusted_proxy' }
  appendVoteAtomically(input: {
    pollId: string
    submissionId: string
    responseId: string
    response: unknown
    clientIp: string | null
    now?: number
  }): Promise<AppendResult>
}
const storage = storageModule as unknown as StorageContract

let resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}

function errorResponse(error: string, status: number, retryAfter?: number) {
  return NextResponse.json(
    { error },
    { status, ...(retryAfter ? { headers: { 'Retry-After': String(retryAfter) } } : {}) }
  )
}

async function notifyCreator(
  poll: StoredPoll,
  _response: StoredPollResponse,
  submissionId: string
): Promise<Exclude<NotificationStatus, 'duplicate'>> {
  const to = process.env.POLL_CREATOR_EMAIL?.trim()
  const client = getResend()
  if (!to || !client) return 'not_configured'

  try {
    const result = await client.emails.send(
      {
        from: sanitizeHeaderValue(process.env.EMAIL_FROM || 'What It Do <notifications@resend.dev>'),
        to,
        subject: 'A What It Do poll received a response',
        html: '<div><h1>New response received</h1><p>A response was recorded successfully.</p><p>Open the private results link you saved when creating the poll to see its details.</p></div>',
      },
      { idempotencyKey: `vote/${poll.id}/${submissionId}` }
    )
    if (result.error) {
      console.error('[whatitdo] vote_notification_failed')
      return 'failed'
    }
    return 'sent'
  } catch {
    console.error('[whatitdo] vote_notification_failed')
    return 'failed'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request)
    if (!body.ok) return errorResponse(body.error, body.status)
    const candidate = body.value
    const pollId = candidate && typeof candidate === 'object' && !Array.isArray(candidate)
      ? (candidate as Record<string, unknown>).pollId
      : undefined
    if (!isValidPollId(pollId)) return errorResponse('Poll not found', 404)

    const raw = await storage.getRedis().get<string | StoredPoll>(`poll:${pollId}`)
    if (!raw) return errorResponse('Poll not found', 404)
    const poll = (typeof raw === 'string' ? JSON.parse(raw) : raw) as StoredPoll
    if (!poll.resultsTokenHash) return errorResponse('This legacy poll is no longer available', 410)
    if (poll.expiresAt <= Date.now()) return errorResponse('Poll not found', 404)

    const parsed = parseVoteInput(candidate, poll)
    if (!parsed.ok) return errorResponse(parsed.error, 400)
    const response: StoredPollResponse = {
      id: nanoid(12),
      voterName: parsed.data.voterName,
      votes: parsed.data.votes,
      ...(parsed.data.counterProposal ? { counterProposal: parsed.data.counterProposal } : {}),
      submittedAt: Date.now(),
    }

    const identity = storage.resolveClientIp(request)
    const appended = await storage.appendVoteAtomically({
      pollId,
      submissionId: parsed.data.submissionId,
      responseId: response.id,
      clientIp: identity.status === 'resolved'
        ? identity.ip
        : process.env.NODE_ENV === 'production' ? null : 'local-development',
      response,
      now: Date.now(),
    })

    if (appended.status === 'duplicate') {
      return NextResponse.json({ success: true, notification: 'duplicate' satisfies NotificationStatus })
    }
    if (appended.status === 'not_found' || appended.status === 'expired') {
      return errorResponse('Poll not found', 404)
    }
    if (appended.status === 'identity_unavailable') {
      return errorResponse('Unable to verify request identity', 429, 60)
    }
    if (appended.status === 'capacity_reached') {
      return errorResponse('This poll has reached its response limit', 409)
    }
    if (appended.status === 'rate_limited') {
      return errorResponse('Too many votes submitted. Please try again later.', 429, appended.retryAfterSeconds ?? 3600)
    }

    const notification = await notifyCreator(poll, response, parsed.data.submissionId)
    return NextResponse.json({ success: true, notification })
  } catch {
    // Upstash error messages can include the full EVAL command, whose ARGV
    // contains a private ballot. Never attach the upstream exception here.
    console.error('[whatitdo] vote_submit_failed')
    return errorResponse('Failed to submit vote', 500)
  }
}
