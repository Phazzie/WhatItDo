import { Redis } from '@upstash/redis'
import { mockRedis } from '@/test/mockRedis'

/**
 * The subset of the Redis client surface used across the app's route
 * handlers. Both `@upstash/redis`'s `Redis` client and the in-memory
 * `mockRedis` test double (used when `USE_MOCK_REDIS=1`) satisfy this shape.
 */
export interface RedisLike {
  get<T = unknown>(key: string): Promise<T | null>
  set(key: string, value: string | number | null, options?: { ex?: number }): Promise<string | number | null>
  rpush(key: string, ...values: string[]): Promise<number>
  lrange(key: string, start: number, stop: number): Promise<string[]>
  ltrim(key: string, start: number, stop: number): Promise<string>
  expire(key: string, seconds: number): Promise<number>
}

if (process.env.USE_MOCK_REDIS === '1' && process.env.VERCEL === '1') {
  // Fail loud rather than silently running a real Vercel deployment on
  // non-persistent, per-instance in-memory storage (e.g. USE_MOCK_REDIS left
  // set from a copied env config). Gated on `VERCEL` rather than
  // `NODE_ENV=production` because e2e/CI intentionally run a production
  // build (`next build && next start`) with USE_MOCK_REDIS=1 outside Vercel.
  throw new Error('USE_MOCK_REDIS=1 is not allowed on Vercel deployments')
}

// USE_MOCK_REDIS=1 swaps in the in-memory test double (used in dev/e2e when
// no Upstash instance is configured) without touching call sites.
export const redis: RedisLike =
  process.env.USE_MOCK_REDIS === '1'
    ? mockRedis
    : new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })

/** 30 days, applied to both `poll:{id}` and `poll:{id}:responses` (H2). */
export const POLL_TTL_SECONDS = 60 * 60 * 24 * 30

/**
 * Minimal sliding-window-log rate limiter built on the `get`/`set`/`expire`
 * primitives common to both the real Upstash client and `mockRedis`.
 *
 * `@upstash/ratelimit`'s built-in algorithms are Lua-script based
 * (`eval`/`evalsha`), which the in-memory test double intentionally does not
 * implement (see `src/test/mockRedis.ts`) — so this hand-rolled limiter is
 * used instead of that package, keeping rate limiting testable against the
 * same mock used everywhere else. `@upstash/ratelimit` remains a listed
 * dependency per the owner decision, available for a future swap to a
 * script-backed implementation if the test double grows `eval` support.
 *
 * Returns `true` if the request identified by `key` is allowed under `limit`
 * requests per `windowSeconds`.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const now = Date.now()
  // RPUSH is atomic, so each request claims a unique slot even under
  // concurrency — a get/set read-modify-write here would let a burst of
  // simultaneous requests all read the same stale state and sail past the
  // limit. Entries are timestamps; the key expires a window after the last
  // request, and denied requests also record a timestamp (extending the
  // lockout), which fails closed against sustained abuse.
  const count = await redis.rpush(key, String(now))
  await redis.expire(key, windowSeconds)

  // Bound the list so sustained traffic (allowed or denied) can't grow it
  // without limit — a generous multiple of `limit` still leaves enough
  // history for the windowed recount below to be accurate at the boundary.
  const cap = Math.max(limit * 4, 50)
  if (count > cap) {
    await redis.ltrim(key, -cap, -1)
  }

  if (count <= limit) {
    return true
  }

  // Over the raw cap: recount only entries inside the sliding window (old
  // timestamps linger until the key TTL clears them).
  const entries = await redis.lrange(key, 0, -1)
  const windowStart = now - windowSeconds * 1000
  const recent = entries.filter((t) => Number(t) > windowStart)
  return recent.length <= limit
}

/**
 * Extracts the client IP from the first value of `x-forwarded-for`, or
 * `null` if absent. Callers should skip rate limiting rather than fall back
 * to a shared bucket — a fixed placeholder would pool every such client
 * into one quota, letting one of them lock out all the others.
 */
export function getClientIp(request: { headers: { get(name: string): string | null } }): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return null
}
