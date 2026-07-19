import { describe, expect, it } from 'vitest'

import { InMemoryRedis } from './inMemoryRedis'

describe('InMemoryRedis Redis-compatible command semantics', () => {
  it('returns an empty range when a negative stop resolves before index zero', async () => {
    const redis = new InMemoryRedis()
    await redis.rpush('list', 'only-item')

    await expect(redis.lrange('list', 0, -2)).resolves.toEqual([])
  })

  it('clears an existing TTL when SET is called without an expiration', async () => {
    const redis = new InMemoryRedis()
    await redis.set('key', 'expiring', { ex: 60 })
    expect(redis.getTtl('key')).toBeGreaterThan(0)

    await redis.set('key', 'persistent')

    await expect(redis.get('key')).resolves.toBe('persistent')
    expect(redis.getTtl('key')).toBeUndefined()
  })
})
