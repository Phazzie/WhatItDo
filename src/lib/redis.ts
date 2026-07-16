import { Redis } from '@upstash/redis'
import { isIP } from 'node:net'
import { InMemoryRedis, inMemoryRedis } from './inMemoryRedis'

export const POLL_IDLE_TTL_SECONDS = 60 * 60 * 24 * 30
export const POLL_ABSOLUTE_TTL_SECONDS = 60 * 60 * 24 * 90
export const RATE_LIMIT_WINDOW_SECONDS = 60 * 60
export const POLL_CREATE_RATE_LIMIT = 10
export const VOTE_IP_RATE_LIMIT = 20
export const VOTE_POLL_RATE_LIMIT = 100
export const MAX_POLL_RESPONSES = 250

export interface RedisLike {
  get<T = unknown>(key: string): Promise<T | null>
  set(key: string, value: string | number | null, options?: { ex?: number }): Promise<unknown>
  lrange(key: string, start: number, stop: number): Promise<string[]>
  eval<T = unknown>(script: string, keys: string[], args: (string | number)[]): Promise<T>
}

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; remaining: 0; retryAfterSeconds: number }

export type AppendVoteResult =
  | { status: 'appended'; responseId: string; responseCount: number }
  | { status: 'duplicate'; responseId: string; responseCount: number }
  | { status: 'not_found' }
  | { status: 'expired' }
  | { status: 'identity_unavailable' }
  | { status: 'capacity_reached' }
  | { status: 'rate_limited'; scope: 'ip' | 'poll'; retryAfterSeconds: number }

export interface AppendVoteInput {
  pollId: string
  submissionId: string
  responseId: string
  response: unknown
  clientIp: string | null
  now?: number
}

export type ClientIpResolution =
  | { status: 'resolved'; ip: string }
  | { status: 'unavailable'; reason: 'missing' | 'untrusted_proxy' }

export const RECOGNIZED_DEPLOYMENT_MARKERS = [
  'VERCEL',
  'VERCEL_ENV',
  'VERCEL_URL',
  'AWS_LAMBDA_FUNCTION_NAME',
  'AWS_EXECUTION_ENV',
  'NETLIFY',
  'RENDER',
  'RENDER_SERVICE_ID',
  'FLY_APP_NAME',
  'K_SERVICE',
  'CF_PAGES',
  'RAILWAY_ENVIRONMENT',
  'DYNO',
] as const

function hasDeploymentMarker(): boolean {
  return RECOGNIZED_DEPLOYMENT_MARKERS.some((name) => Boolean(process.env[name]))
}

function isLoopbackBaseUrl(value: string | undefined): boolean {
  if (!value) return false
  try {
    const hostname = new URL(value).hostname.toLowerCase()
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  } catch {
    return false
  }
}

export function isInMemoryRedisAllowed(): boolean {
  if (process.env.NODE_ENV === 'test') return true
  return (
    process.env.E2E_TEST === '1' &&
    isLoopbackBaseUrl(process.env.E2E_BASE_URL) &&
    !hasDeploymentMarker()
  )
}

let selectedRedis: RedisLike | InMemoryRedis | null = null

function createUpstashRedis(): RedisLike {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  const missing = [
    !url ? 'UPSTASH_REDIS_REST_URL' : null,
    !token ? 'UPSTASH_REDIS_REST_TOKEN' : null,
  ].filter(Boolean)
  if (missing.length > 0) {
    throw new Error(
      `Redis is not configured. Missing ${missing.join(' and ')}. ` +
        'Configure Upstash Redis; in-memory storage is permitted only in tests or an explicit loopback E2E run.'
    )
  }

  const client = new Redis({ url: url as string, token: token as string })
  return {
    get: (key) => client.get(key),
    set: (key, value, options) =>
      options?.ex === undefined
        ? client.set(key, value)
        : client.set(key, value, { ex: options.ex }),
    lrange: (key, start, stop) => client.lrange<string>(key, start, stop),
    eval: <T = unknown>(script: string, keys: string[], args: (string | number)[]) =>
      client.eval<(string | number)[], T>(script, keys, args),
  }
}

/** Lazily select storage on first request; importing this module is build-safe. */
export function getRedis(): RedisLike | InMemoryRedis {
  if (!selectedRedis) {
    selectedRedis = isInMemoryRedisAllowed() ? inMemoryRedis : createUpstashRedis()
  }
  return selectedRedis
}

export const RATE_LIMIT_LUA_SCRIPT = `
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
if current >= limit then
  local retry = redis.call('TTL', KEYS[1])
  if retry < 1 then retry = window end
  return {'limited', retry}
end
local next = redis.call('INCR', KEYS[1])
if next == 1 then redis.call('EXPIRE', KEYS[1], window) end
return {'allowed', limit - next}
`

export const APPEND_VOTE_LUA_SCRIPT = `
local rawPoll = redis.call('GET', KEYS[1])
if not rawPoll then return {'not_found'} end

local decoded, poll = pcall(cjson.decode, rawPoll)
if not decoded then return {'corrupt'} end
local createdAt = tonumber(poll.createdAt)
if not createdAt then return {'corrupt'} end
local now = tonumber(ARGV[4])
local idleTtl = tonumber(ARGV[5])
local absoluteTtl = tonumber(ARGV[6])
local maximumExpiry = createdAt + (absoluteTtl * 1000)
local absoluteExpiry = tonumber(poll.expiresAt)
if not absoluteExpiry or absoluteExpiry > maximumExpiry then absoluteExpiry = maximumExpiry end
local remaining = math.floor((absoluteExpiry - now) / 1000)
if remaining < 1 then
  redis.call('DEL', KEYS[1], KEYS[2], KEYS[3])
  return {'expired'}
end

local existing = redis.call('HGET', KEYS[3], ARGV[1])
if existing then return {'duplicate', existing, redis.call('LLEN', KEYS[2])} end

if ARGV[11] ~= '1' then return {'identity_unavailable'} end

local responseLimit = tonumber(ARGV[10])
local responseCount = redis.call('LLEN', KEYS[2])
if responseCount >= responseLimit then return {'capacity_reached'} end

local window = tonumber(ARGV[7])
local ipLimit = tonumber(ARGV[8])
local pollLimit = tonumber(ARGV[9])
local ipCount = tonumber(redis.call('GET', KEYS[4]) or '0')
if ipCount >= ipLimit then
  local retry = redis.call('TTL', KEYS[4])
  if retry < 1 then retry = window end
  return {'rate_limited', 'ip', retry}
end
local pollCount = tonumber(redis.call('GET', KEYS[5]) or '0')
if pollCount >= pollLimit then
  local retry = redis.call('TTL', KEYS[5])
  if retry < 1 then retry = window end
  return {'rate_limited', 'poll', retry}
end

ipCount = redis.call('INCR', KEYS[4])
if ipCount == 1 then redis.call('EXPIRE', KEYS[4], window) end
pollCount = redis.call('INCR', KEYS[5])
if pollCount == 1 then redis.call('EXPIRE', KEYS[5], window) end

responseCount = redis.call('RPUSH', KEYS[2], ARGV[3])
redis.call('HSET', KEYS[3], ARGV[1], ARGV[2])
local ttl = math.min(idleTtl, remaining)
redis.call('EXPIRE', KEYS[1], ttl)
redis.call('EXPIRE', KEYS[2], ttl)
redis.call('EXPIRE', KEYS[3], ttl)
return {'appended', ARGV[2], responseCount}
`

function parseRateLimitResult(raw: unknown): RateLimitResult {
  if (!Array.isArray(raw)) throw new Error('Redis returned an invalid rate-limit result')
  if (raw[0] === 'allowed') {
    return { allowed: true, remaining: Number(raw[1]) }
  }
  if (raw[0] === 'limited') {
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, Number(raw[1])) }
  }
  throw new Error(`Redis returned an unknown rate-limit status: ${String(raw[0])}`)
}

async function consumeRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const client = getRedis()
  if (client instanceof InMemoryRedis) {
    const result = await client.consumeRateLimit(key, limit, windowSeconds)
    return result.allowed
      ? { allowed: true, remaining: result.remaining }
      : { allowed: false, remaining: 0, retryAfterSeconds: result.retryAfterSeconds as number }
  }
  return parseRateLimitResult(
    await client.eval<unknown>(RATE_LIMIT_LUA_SCRIPT, [key], [limit, windowSeconds])
  )
}

export function checkPollCreateRateLimit(clientIp: string): Promise<RateLimitResult> {
  return consumeRateLimit(`ratelimit:poll:${clientIp}`, POLL_CREATE_RATE_LIMIT, RATE_LIMIT_WINDOW_SECONDS)
}

function parseAppendVoteResult(raw: unknown): AppendVoteResult {
  if (!Array.isArray(raw)) throw new Error('Redis returned an invalid append result')
  switch (raw[0]) {
    case 'appended':
      return { status: 'appended', responseId: String(raw[1]), responseCount: Number(raw[2]) }
    case 'duplicate':
      return { status: 'duplicate', responseId: String(raw[1]), responseCount: Number(raw[2]) }
    case 'not_found':
      return { status: 'not_found' }
    case 'expired':
      return { status: 'expired' }
    case 'identity_unavailable':
      return { status: 'identity_unavailable' }
    case 'capacity_reached':
      return { status: 'capacity_reached' }
    case 'rate_limited':
      return {
        status: 'rate_limited',
        scope: raw[1] === 'poll' ? 'poll' : 'ip',
        retryAfterSeconds: Math.max(1, Number(raw[2])),
      }
    case 'corrupt':
      throw new Error('Stored poll is corrupt')
    default:
      throw new Error(`Redis returned an unknown append status: ${String(raw[0])}`)
  }
}

export async function appendVoteAtomically(input: AppendVoteInput): Promise<AppendVoteResult> {
  const keys = [
    `poll:${input.pollId}`,
    `poll:${input.pollId}:responses`,
    `poll:${input.pollId}:submissions`,
    `ratelimit:vote:ip:${input.clientIp ?? 'unavailable'}`,
    `ratelimit:vote:poll:${input.pollId}`,
  ]
  const responseJson = JSON.stringify(input.response)
  const now = input.now ?? Date.now()
  const client = getRedis()
  let raw: unknown
  if (client instanceof InMemoryRedis) {
    raw = await client.appendVoteAtomically({
      pollKey: keys[0],
      responsesKey: keys[1],
      submissionsKey: keys[2],
      ipRateKey: keys[3],
      pollRateKey: keys[4],
      submissionId: input.submissionId,
      responseId: input.responseId,
      responseJson,
      now,
      idleTtlSeconds: POLL_IDLE_TTL_SECONDS,
      absoluteTtlSeconds: POLL_ABSOLUTE_TTL_SECONDS,
      rateWindowSeconds: RATE_LIMIT_WINDOW_SECONDS,
      ipLimit: VOTE_IP_RATE_LIMIT,
      pollLimit: VOTE_POLL_RATE_LIMIT,
      responseLimit: MAX_POLL_RESPONSES,
      clientIdentityAvailable: input.clientIp !== null,
    })
  } else {
    raw = await client.eval<unknown>(APPEND_VOTE_LUA_SCRIPT, keys, [
      input.submissionId,
      input.responseId,
      responseJson,
      now,
      POLL_IDLE_TTL_SECONDS,
      POLL_ABSOLUTE_TTL_SECONDS,
      RATE_LIMIT_WINDOW_SECONDS,
      VOTE_IP_RATE_LIMIT,
      VOTE_POLL_RATE_LIMIT,
      MAX_POLL_RESPONSES,
      input.clientIp === null ? 0 : 1,
    ])
  }
  return parseAppendVoteResult(raw)
}

function firstHeaderValue(value: string | null): string | null {
  const first = value?.split(',')[0]?.trim()
  return first && isIP(first) !== 0 ? first : null
}

export function resolveClientIp(request: {
  headers: { get(name: string): string | null }
}): ClientIpResolution {
  const production = process.env.NODE_ENV === 'production'
  if (production && process.env.VERCEL === '1') {
    const ip =
      firstHeaderValue(request.headers.get('x-vercel-forwarded-for')) ??
      firstHeaderValue(request.headers.get('x-real-ip'))
    return ip ? { status: 'resolved', ip } : { status: 'unavailable', reason: 'missing' }
  }
  if (production && process.env.TRUST_PROXY !== '1') {
    return { status: 'unavailable', reason: 'untrusted_proxy' }
  }
  const ip =
    firstHeaderValue(request.headers.get('x-forwarded-for')) ??
    firstHeaderValue(request.headers.get('x-real-ip'))
  return ip ? { status: 'resolved', ip } : { status: 'unavailable', reason: 'missing' }
}

/** Reset the selected client and process-local data between configuration tests. */
export function resetRedisForTests(): void {
  selectedRedis = null
  inMemoryRedis.reset()
}
