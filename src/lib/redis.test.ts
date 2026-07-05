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
})
