/**
 * In-memory mock of the subset of the `@upstash/redis` client used by the
 * app's route handlers. Intended to be `vi.mock`'d in place of `@/lib/redis`
 * in tests (see `src/test/smoke.test.ts`), and reused by later test waves
 * (e.g. concurrency, TTL, and rate-limit tests).
 *
 * Keep the surface minimal: only `get`, `set`, `rpush`, `lrange`, and
 * `expire` are implemented, matching current + planned production usage.
 */

export type MockRedisValue = string | number | null

export interface SetOptions {
  ex?: number
}

class MockRedis {
  private store = new Map<string, MockRedisValue>()
  private lists = new Map<string, string[]>()
  /** key -> TTL in seconds, as last set via `set(..., { ex })` or `expire`. */
  private ttls = new Map<string, number>()

  async get<T = unknown>(key: string): Promise<T | null> {
    if (this.store.has(key)) {
      return this.store.get(key) as unknown as T
    }
    return null
  }

  async set(key: string, value: MockRedisValue, options?: SetOptions): Promise<'OK'> {
    this.store.set(key, value)
    if (options?.ex !== undefined) {
      this.ttls.set(key, options.ex)
    }
    return 'OK'
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    const list = this.lists.get(key) ?? []
    list.push(...values)
    this.lists.set(key, list)
    return list.length
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.lists.get(key) ?? []
    const len = list.length
    // Redis semantics: negative indices count from the end BEFORE clamping,
    // and start > stop (after resolution) yields an empty list — clamping a
    // negative-resolved stop up to 0 would wrongly return the first element.
    let from = start < 0 ? len + start : start
    let to = stop < 0 ? len + stop : stop
    from = Math.max(from, 0)
    to = Math.min(to, len - 1)
    if (from > to || from >= len) {
      return []
    }
    // lrange's `stop` is inclusive; Array.slice's end is exclusive.
    return list.slice(from, to + 1)
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (!this.store.has(key) && !this.lists.has(key)) {
      return 0
    }
    this.ttls.set(key, seconds)
    return 1
  }

  /** Test helper: inspect the TTL (seconds) last set for a key, if any. */
  getTtl(key: string): number | undefined {
    return this.ttls.get(key)
  }

  /** Test helper: reset all state between tests. */
  reset(): void {
    this.store.clear()
    this.lists.clear()
    this.ttls.clear()
  }
}

export const mockRedis = new MockRedis()
