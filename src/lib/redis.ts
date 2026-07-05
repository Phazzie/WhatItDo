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
  expire(key: string, seconds: number): Promise<number>
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
  // The real Upstash client auto-deserializes stored JSON (returning an
  // array), while the test mock returns the raw string — handle both.
  const raw = await redis.get<string | number[]>(key)
  const timestamps: number[] = Array.isArray(raw) ? raw : raw ? JSON.parse(raw) : []
  const windowStart = now - windowSeconds * 1000
  const recent = timestamps.filter((t) => t > windowStart)

  if (recent.length >= limit) {
    return false
  }

  recent.push(now)
  await redis.set(key, JSON.stringify(recent), { ex: windowSeconds })
  return true
}

/** Extracts the client IP from the first value of `x-forwarded-for`. */
export function getClientIp(request: { headers: { get(name: string): string | null } }): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return 'unknown'
}
