export type InMemoryValue = string | number | null

export interface InMemorySetOptions {
  ex?: number
}

export interface InMemoryRateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds?: number
}

export interface InMemoryAppendInput {
  pollKey: string
  responsesKey: string
  submissionsKey: string
  ipRateKey: string
  pollRateKey: string
  submissionId: string
  responseId: string
  responseJson: string
  now: number
  idleTtlSeconds: number
  absoluteTtlSeconds: number
  rateWindowSeconds: number
  ipLimit: number
  pollLimit: number
  responseLimit: number
  clientIdentityAvailable: boolean
}

export type InMemoryAppendResult =
  | ['appended', string, number]
  | ['duplicate', string, number]
  | ['not_found']
  | ['expired']
  | ['identity_unavailable']
  | ['capacity_reached']
  | ['rate_limited', 'ip' | 'poll', number]

/**
 * A process-local Redis substitute for unit tests and explicitly local E2E runs.
 * It deliberately lives in production source so production modules never import
 * from src/test. Selection and deployment fail-closed checks live in redis.ts.
 */
export class InMemoryRedis {
  readonly kind = 'in-memory' as const
  private readonly values = new Map<string, InMemoryValue>()
  private readonly lists = new Map<string, string[]>()
  private readonly hashes = new Map<string, Map<string, string>>()
  private readonly expiresAt = new Map<string, number>()

  private purgeExpired(key: string): void {
    const deadline = this.expiresAt.get(key)
    if (deadline !== undefined && deadline <= Date.now()) {
      this.values.delete(key)
      this.lists.delete(key)
      this.hashes.delete(key)
      this.expiresAt.delete(key)
    }
  }

  private hasKey(key: string): boolean {
    this.purgeExpired(key)
    return this.values.has(key) || this.lists.has(key) || this.hashes.has(key)
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    this.purgeExpired(key)
    return this.values.has(key) ? (this.values.get(key) as T) : null
  }

  async set(key: string, value: InMemoryValue, options?: InMemorySetOptions): Promise<'OK'> {
    this.values.set(key, value)
    this.lists.delete(key)
    this.hashes.delete(key)
    if (options?.ex !== undefined) {
      this.expiresAt.set(key, Date.now() + options.ex * 1000)
    } else {
      this.expiresAt.delete(key)
    }
    return 'OK'
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    this.purgeExpired(key)
    const list = this.lists.get(key) ?? []
    list.push(...values)
    this.lists.set(key, list)
    return list.length
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    this.purgeExpired(key)
    const list = this.lists.get(key) ?? []
    const length = list.length
    let from = start < 0 ? length + start : start
    let to = stop < 0 ? length + stop : stop
    from = Math.max(from, 0)
    to = Math.min(to, length - 1)
    return from > to || from >= length ? [] : list.slice(from, to + 1)
  }

  async consumeRateLimit(key: string, limit: number, windowSeconds: number): Promise<InMemoryRateLimitResult> {
    return this.consumeRateLimitSync(key, limit, windowSeconds)
  }

  private consumeRateLimitSync(key: string, limit: number, windowSeconds: number): InMemoryRateLimitResult {
    this.purgeExpired(key)
    const current = Number(this.values.get(key) ?? 0)
    const retryAfterSeconds = this.ttlSync(key)
    if (current >= limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: retryAfterSeconds > 0 ? retryAfterSeconds : windowSeconds,
      }
    }
    const next = current + 1
    this.values.set(key, next)
    if (current === 0 || retryAfterSeconds < 1) {
      this.expiresAt.set(key, Date.now() + windowSeconds * 1000)
    }
    return { allowed: true, remaining: Math.max(0, limit - next) }
  }

  async appendVoteAtomically(input: InMemoryAppendInput): Promise<InMemoryAppendResult> {
    this.purgeExpired(input.pollKey)
    const rawPoll = this.values.get(input.pollKey)
    if (typeof rawPoll !== 'string') return ['not_found']

    let createdAt: number
    let declaredExpiry: number | undefined
    try {
      const poll = JSON.parse(rawPoll) as { createdAt?: unknown; expiresAt?: unknown }
      createdAt = Number(poll.createdAt)
      declaredExpiry = poll.expiresAt === undefined ? undefined : Number(poll.expiresAt)
    } catch {
      throw new Error('Stored poll is not valid JSON')
    }
    if (!Number.isFinite(createdAt)) throw new Error('Stored poll has an invalid createdAt value')

    const maximumExpiry = createdAt + input.absoluteTtlSeconds * 1000
    const absoluteExpiry = Number.isFinite(declaredExpiry)
      ? Math.min(maximumExpiry, declaredExpiry as number)
      : maximumExpiry
    const remainingSeconds = Math.floor((absoluteExpiry - input.now) / 1000)
    if (remainingSeconds < 1) {
      this.deleteKeys(input.pollKey, input.responsesKey, input.submissionsKey)
      return ['expired']
    }

    this.purgeExpired(input.submissionsKey)
    const existing = this.hashes.get(input.submissionsKey)?.get(input.submissionId)
    if (existing) {
      this.purgeExpired(input.responsesKey)
      return ['duplicate', existing, (this.lists.get(input.responsesKey) ?? []).length]
    }

    if (!input.clientIdentityAvailable) return ['identity_unavailable']

    this.purgeExpired(input.responsesKey)
    const responses = this.lists.get(input.responsesKey) ?? []
    if (responses.length >= input.responseLimit) return ['capacity_reached']

    const ipRate = this.peekRateLimit(input.ipRateKey, input.ipLimit, input.rateWindowSeconds)
    if (!ipRate.allowed) return ['rate_limited', 'ip', ipRate.retryAfterSeconds as number]
    const pollRate = this.peekRateLimit(input.pollRateKey, input.pollLimit, input.rateWindowSeconds)
    if (!pollRate.allowed) return ['rate_limited', 'poll', pollRate.retryAfterSeconds as number]

    this.consumeRateLimitSync(input.ipRateKey, input.ipLimit, input.rateWindowSeconds)
    this.consumeRateLimitSync(input.pollRateKey, input.pollLimit, input.rateWindowSeconds)
    responses.push(input.responseJson)
    this.lists.set(input.responsesKey, responses)
    const submissions = this.hashes.get(input.submissionsKey) ?? new Map<string, string>()
    submissions.set(input.submissionId, input.responseId)
    this.hashes.set(input.submissionsKey, submissions)

    const ttl = Math.min(input.idleTtlSeconds, remainingSeconds)
    const deadline = Date.now() + ttl * 1000
    this.expiresAt.set(input.pollKey, deadline)
    this.expiresAt.set(input.responsesKey, deadline)
    this.expiresAt.set(input.submissionsKey, deadline)
    return ['appended', input.responseId, responses.length]
  }

  private peekRateLimit(key: string, limit: number, windowSeconds: number): InMemoryRateLimitResult {
    this.purgeExpired(key)
    const current = Number(this.values.get(key) ?? 0)
    if (current < limit) return { allowed: true, remaining: limit - current }
    const ttl = this.ttlSync(key)
    return { allowed: false, remaining: 0, retryAfterSeconds: ttl > 0 ? ttl : windowSeconds }
  }

  private ttlSync(key: string): number {
    if (!this.hasKey(key)) return -2
    const deadline = this.expiresAt.get(key)
    return deadline === undefined ? -1 : Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
  }

  private deleteKeys(...keys: string[]): void {
    for (const key of keys) {
      this.values.delete(key)
      this.lists.delete(key)
      this.hashes.delete(key)
      this.expiresAt.delete(key)
    }
  }

  /** Test-only inspection and reset helpers. */
  getTtl(key: string): number | undefined {
    const ttl = this.expiresAt.get(key)
    return ttl === undefined ? undefined : Math.max(0, Math.ceil((ttl - Date.now()) / 1000))
  }

  reset(): void {
    this.values.clear()
    this.lists.clear()
    this.hashes.clear()
    this.expiresAt.clear()
  }
}

export const inMemoryRedis = new InMemoryRedis()
