import * as storageModule from '@/lib/redis'
import { readJsonBody } from '@/lib/requestBody'
import { verifyResultsToken } from '@/lib/resultsToken'
import type { PollResponse, PollResults, StoredPoll, StoredPollResponse } from '@/lib/types'
import { parseResultsInput } from '@/lib/validation'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
}

type RedisReader = {
  get<T = unknown>(key: string): Promise<T | null>
  lrange<T = unknown>(key: string, start: number, stop: number): Promise<T[]>
}
const storage = storageModule as unknown as { getRedis(): RedisReader }

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE_HEADERS })
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request)
    if (!body.ok) return reply({ error: body.error }, body.status)
    const parsed = parseResultsInput(body.value)
    if (!parsed.ok) return reply({ error: parsed.error }, 400)

    const redis = storage.getRedis()
    const rawPoll = await redis.get<string | StoredPoll>(`poll:${parsed.data.pollId}`)
    if (!rawPoll) return reply({ error: 'Poll not found' }, 404)
    const poll = (typeof rawPoll === 'string' ? JSON.parse(rawPoll) : rawPoll) as StoredPoll
    if (!poll.resultsTokenHash) return reply({ error: 'This legacy poll is no longer available' }, 410)
    if (poll.expiresAt <= Date.now()) return reply({ error: 'Poll not found' }, 404)
    if (!verifyResultsToken(parsed.data.resultsToken, poll.resultsTokenHash)) {
      return reply({ error: 'Poll not found' }, 404)
    }

    const rawResponses = await redis.lrange<string | StoredPollResponse>(
      `poll:${parsed.data.pollId}:responses`,
      0,
      -1
    )
    const responses = rawResponses.map((raw) => {
      const stored = (typeof raw === 'string' ? JSON.parse(raw) : raw) as StoredPollResponse
      const response: PollResponse = {
        voterName: stored.voterName,
        votes: stored.votes,
        ...(stored.counterProposal ? { counterProposal: stored.counterProposal } : {}),
        submittedAt: stored.submittedAt,
      }
      return response
    })
    const results: PollResults = {
      title: poll.title,
      mode: poll.mode,
      suggestions: poll.suggestions,
      createdAt: poll.createdAt,
      expiresAt: poll.expiresAt,
      responses,
    }
    return reply({ poll: results })
  } catch {
    console.error('[whatitdo] results_fetch_failed')
    return reply({ error: 'Failed to fetch results' }, 500)
  }
}
