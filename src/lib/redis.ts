import { createClient } from 'redis'

let redis: ReturnType<typeof createClient> | null = null

export async function getRedis() {
  if (!redis) {
    redis = createClient({ url: process.env.REDIS_URL })
    redis.on('error', (err) => console.error('Redis error:', err))
    await redis.connect()
  }
  return redis
}
