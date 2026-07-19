import * as storageModule from '@/lib/redis'
import { createResultsToken, hashResultsToken } from '@/lib/resultsToken'
import { readJsonBody } from '@/lib/requestBody'
import type { PublicPoll, StoredPoll } from '@/lib/types'
import { isValidPollId, parsePollInput } from '@/lib/validation'
import { nanoid } from 'nanoid'
import { NextRequest, NextResponse } from 'next/server'

const ABSOLUTE_TTL_MS = 90 * 24 * 60 * 60 * 1000
const MAX_CREATE_ATTEMPTS = 3

type RedisReader = {
  get<T = unknown>(key: string): Promise<T | null>
}
type StorageContract = {
  getRedis(): RedisReader
  resolveClientIp(request: NextRequest):
    | { status: 'resolved'; ip: string }
    | { status: 'unavailable'; reason: 'missing' | 'untrusted_proxy' }
  checkPollCreateRateLimit(ip: string): Promise<
    | { allowed: true; remaining: number }
    | { allowed: false; remaining: 0; retryAfterSeconds: number }
  >
  createPollAtomically(poll: StoredPoll): Promise<
    | { status: 'created' }
    | { status: 'namespace_conflict' }
  >
}
const storage = storageModule as unknown as StorageContract

function publicPoll(poll: StoredPoll): PublicPoll {
  return { title: poll.title, mode: poll.mode, suggestions: poll.suggestions }
}

function jsonError(error: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ error }, { status, headers })
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request)
    if (!body.ok) return jsonError(body.error, body.status)
    const parsed = parsePollInput(body.value)
    if (!parsed.ok) return jsonError(parsed.error, 400)

    const identity = storage.resolveClientIp(request)
    if (identity.status === 'unavailable' && process.env.NODE_ENV === 'production') {
      return jsonError('Unable to verify request identity', 429, { 'Retry-After': '60' })
    }
    const rate = await storage.checkPollCreateRateLimit(
      identity.status === 'resolved' ? identity.ip : 'local-development'
    )
    if (!rate.allowed) {
      return jsonError('Too many polls created. Please try again later.', 429, {
        'Retry-After': String(rate.retryAfterSeconds),
      })
    }

    for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
      const id = nanoid(10)
      const resultsToken = createResultsToken()
      const createdAt = Date.now()
      const poll: StoredPoll = {
        id,
        ...parsed.data,
        createdAt,
        expiresAt: createdAt + ABSOLUTE_TTL_MS,
        resultsTokenHash: hashResultsToken(resultsToken),
      }

      const created = await storage.createPollAtomically(poll)
      if (created.status === 'created') {
        return NextResponse.json(
          { id, resultsToken, poll: publicPoll(poll) },
          { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
        )
      }
    }

    return jsonError('Failed to create poll', 500)
  } catch {
    console.error('[whatitdo] poll_create_failed')
    return jsonError('Failed to create poll', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return jsonError('Poll ID required', 400)
    if (!isValidPollId(id)) return jsonError('Poll not found', 404)

    const raw = await storage.getRedis().get<string | StoredPoll>(`poll:${id}`)
    if (!raw) return jsonError('Poll not found', 404)
    const poll = (typeof raw === 'string' ? JSON.parse(raw) : raw) as StoredPoll
    if (!poll.resultsTokenHash) return jsonError('This legacy poll is no longer available', 410)
    if (poll.expiresAt <= Date.now()) return jsonError('Poll not found', 404)

    return NextResponse.json(
      { poll: publicPoll(poll) },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    console.error('[whatitdo] poll_fetch_failed')
    return jsonError('Failed to fetch poll', 500)
  }
}
