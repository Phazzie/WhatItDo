import * as storageModule from '@/lib/redis'
import { createResultsToken, hashResultsToken } from '@/lib/resultsToken'
import { readJsonBody } from '@/lib/requestBody'
import type { PublicPoll, StoredPoll } from '@/lib/types'
import { isValidPollId, parsePollInput } from '@/lib/validation'
import { nanoid } from 'nanoid'
import { NextRequest, NextResponse } from 'next/server'

const IDLE_TTL_SECONDS = 60 * 60 * 24 * 30
const ABSOLUTE_TTL_MS = 90 * 24 * 60 * 60 * 1000

type RedisReader = {
  get<T = unknown>(key: string): Promise<T | null>
  set(key: string, value: string, options?: { ex?: number }): Promise<unknown>
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

    await storage.getRedis().set(`poll:${id}`, JSON.stringify(poll), { ex: IDLE_TTL_SECONDS })
    return NextResponse.json({ id, resultsToken, poll: publicPoll(poll) })
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
