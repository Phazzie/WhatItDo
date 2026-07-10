import { describe, it, expect, beforeEach } from 'vitest'
import { mockRedis } from '@/test/mockRedis'

process.env.USE_MOCK_REDIS = '1'

describe('checkRateLimit under concurrency', () => {
  beforeEach(() => {
    mockRedis.reset()
  })

  it('allows exactly the limit when a burst of concurrent requests arrives', async () => {
    const { checkRateLimit } = await import('./redis')
    const results = await Promise.all(
      Array.from({ length: 30 }, () => checkRateLimit('ratelimit:test:burst', 20, 3600))
    )
    const allowed = results.filter(Boolean).length
    expect(allowed).toBe(20)
  })

  it('bounds the backing list under sustained traffic instead of growing it without limit (self-review)', async () => {
    const { checkRateLimit } = await import('./redis')
    for (let i = 0; i < 200; i++) {
      await checkRateLimit('ratelimit:test:sustained', 20, 3600)
    }
    const entries = await mockRedis.lrange('ratelimit:test:sustained', 0, -1)
    expect(entries.length).toBeLessThan(200)
  })
})

describe('getClientIp (self-review)', () => {
  it('returns the first x-forwarded-for value when present', async () => {
    const { getClientIp } = await import('./redis')
    const request = { headers: { get: (name: string) => (name === 'x-forwarded-for' ? '1.2.3.4, 5.6.7.8' : null) } }
    expect(getClientIp(request)).toBe('1.2.3.4')
  })

  it('returns null (not a shared placeholder) when x-forwarded-for is absent', async () => {
    const { getClientIp } = await import('./redis')
    const request = { headers: { get: () => null } }
    expect(getClientIp(request)).toBeNull()
  })
})
