import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const nodeRedis = vi.hoisted(() => {
  function makeClient() {
    const connect = vi.fn()
    const disconnect = vi.fn()
    const destroy = vi.fn()
    const client = {
      isOpen: false,
      on: vi.fn().mockReturnThis(),
      connect,
      disconnect,
      destroy,
      get: vi.fn(),
      set: vi.fn(),
      lRange: vi.fn(),
      eval: vi.fn(),
    }

    connect.mockImplementation(async () => {
      client.isOpen = true
    })
    disconnect.mockImplementation(async () => {
      if (!client.isOpen) throw new Error('The client is closed')
      client.isOpen = false
    })
    destroy.mockImplementation(() => {
      if (!client.isOpen) throw new Error('The client is closed')
      client.isOpen = false
    })

    return client
  }

  return {
    createClient: vi.fn(makeClient),
    makeClient,
  }
})

const upstash = vi.hoisted(() => ({ Redis: vi.fn() }))

vi.mock('redis', () => ({ createClient: nodeRedis.createClient }))
vi.mock('@upstash/redis', () => ({ Redis: upstash.Redis }))

import { getRedis, resetRedisForTests } from './redis'

describe('durable REDIS_URL protocol adapter', () => {
  beforeEach(() => {
    resetRedisForTests()
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('E2E_TEST', '')
    vi.stubEnv('REDIS_URL', 'redis://redis.example.test:6379')
    // These may remain set after a hosting-provider migration. REDIS_URL is authoritative.
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://stale-upstash.example.test')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'stale-token')
    nodeRedis.createClient.mockReset()
    nodeRedis.createClient.mockImplementation(nodeRedis.makeClient)
    upstash.Redis.mockReset()
  })

  afterEach(() => {
    resetRedisForTests()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('prefers REDIS_URL and defers construction and connection until the first command', async () => {
    const redis = getRedis()

    expect(nodeRedis.createClient).not.toHaveBeenCalled()
    expect(upstash.Redis).not.toHaveBeenCalled()

    const command = redis.get('poll:poll123456')
    const client = nodeRedis.createClient.mock.results[0]?.value
    client.get.mockResolvedValue('stored-poll')

    await expect(command).resolves.toBe('stored-poll')
    expect(nodeRedis.createClient).toHaveBeenCalledTimes(1)
    expect(nodeRedis.createClient).toHaveBeenCalledWith({
      url: 'redis://redis.example.test:6379',
      disableOfflineQueue: true,
      socket: {
        connectTimeout: 5_000,
        reconnectStrategy: expect.any(Function),
      },
    })
    expect(client.on).toHaveBeenCalledWith('error', expect.any(Function))
    expect(client.on).toHaveBeenCalledWith('end', expect.any(Function))
    expect(client.connect).toHaveBeenCalledTimes(1)
    expect(client.connect.mock.invocationCallOrder[0]).toBeLessThan(
      client.get.mock.invocationCallOrder[0]
    )
    expect(client.get).toHaveBeenCalledWith('poll:poll123456')
    expect(getRedis()).toBe(redis)
    expect(upstash.Redis).not.toHaveBeenCalled()

    const createCalls = nodeRedis.createClient.mock.calls as unknown as Array<[{
      socket: { reconnectStrategy: (retries: number) => number | false }
    }]>
    const reconnectStrategy = createCalls[0][0].socket.reconnectStrategy
    expect(reconnectStrategy(0)).toBe(100)
    expect(reconnectStrategy(1)).toBe(200)
    expect(reconnectStrategy(2)).toBe(false)
  })

  it('shares one connection attempt across concurrent first commands', async () => {
    let finishConnecting!: () => void
    const connecting = new Promise<void>((resolve) => {
      finishConnecting = resolve
    })
    const client = nodeRedis.makeClient()
    client.connect.mockImplementation(() => {
      client.isOpen = true
      return connecting
    })
    client.get.mockResolvedValue('value')
    client.set.mockResolvedValue('OK')
    nodeRedis.createClient.mockReturnValue(client)

    const redis = getRedis()
    const read = redis.get('shared-key')
    const write = redis.set('other-key', 'value')

    expect(nodeRedis.createClient).toHaveBeenCalledTimes(1)
    expect(client.connect).toHaveBeenCalledTimes(1)
    expect(client.get).not.toHaveBeenCalled()
    expect(client.set).not.toHaveBeenCalled()

    finishConnecting()
    await expect(Promise.all([read, write])).resolves.toEqual(['value', 'OK'])
    expect(client.connect).toHaveBeenCalledTimes(1)
  })

  it('maps the minimal RedisLike command surface to node-redis', async () => {
    const client = nodeRedis.makeClient()
    client.get.mockResolvedValue('value')
    client.set.mockResolvedValue('OK')
    client.lRange.mockResolvedValue(['a', 'b'])
    client.eval.mockResolvedValue(['allowed', 9])
    nodeRedis.createClient.mockReturnValue(client)

    const redis = getRedis()
    expect('eval' in redis).toBe(true)
    if (!('eval' in redis)) throw new Error('Expected the protocol Redis adapter')

    await expect(redis.get('key')).resolves.toBe('value')
    await expect(redis.set('plain', 'value')).resolves.toBe('OK')
    await expect(redis.set('expiring', 'value', { ex: 60 })).resolves.toBe('OK')
    await expect(redis.lrange('list', 0, -1)).resolves.toEqual(['a', 'b'])
    await expect(redis.eval(
      'return {KEYS[1], ARGV[1], ARGV[2]}',
      ['key'],
      [42, 'argument']
    )).resolves.toEqual(['allowed', 9])

    expect(client.get).toHaveBeenCalledWith('key')
    expect(client.set).toHaveBeenNthCalledWith(1, 'plain', 'value')
    expect(client.set).toHaveBeenNthCalledWith(2, 'expiring', 'value', {
      expiration: { type: 'EX', value: 60 },
    })
    expect(client.lRange).toHaveBeenCalledWith('list', 0, -1)
    expect(client.eval).toHaveBeenCalledWith(
      'return {KEYS[1], ARGV[1], ARGV[2]}',
      { keys: ['key'], arguments: ['42', 'argument'] }
    )
  })

  it('installs a generic error listener so an emitted client error is handled', async () => {
    const client = nodeRedis.makeClient()
    client.get.mockResolvedValue(null)
    nodeRedis.createClient.mockReturnValue(client)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await getRedis().get('key')

    const errorRegistration = client.on.mock.calls.find(([event]) => event === 'error')
    expect(errorRegistration?.[1]).toEqual(expect.any(Function))
    expect(() => errorRegistration?.[1](new Error('socket failed'))).not.toThrow()
    expect(consoleError).toHaveBeenCalledWith('[whatitdo] redis_client_error')
    expect(consoleError).not.toHaveBeenCalledWith(expect.any(Error))
  })

  it('selects a fresh client after terminal error closes the socket without end', async () => {
    const firstClient = nodeRedis.makeClient()
    firstClient.get.mockResolvedValue('first')
    const secondClient = nodeRedis.makeClient()
    secondClient.get.mockResolvedValue('second')
    nodeRedis.createClient
      .mockReturnValueOnce(firstClient)
      .mockReturnValueOnce(secondClient)

    const redis = getRedis()
    await expect(redis.get('key')).resolves.toBe('first')
    const errorRegistration = firstClient.on.mock.calls.find(([event]) => event === 'error')
    expect(errorRegistration?.[1]).toEqual(expect.any(Function))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    firstClient.isOpen = false
    errorRegistration?.[1](new Error('reconnect attempts exhausted'))
    await new Promise<void>((resolve) => queueMicrotask(resolve))

    await expect(redis.get('key')).resolves.toBe('second')
    expect(nodeRedis.createClient).toHaveBeenCalledTimes(2)
    expect(consoleError).toHaveBeenCalledWith('[whatitdo] redis_client_error')
  })

  it('preserves an initial connection error from a closed client and retries later', async () => {
    const firstClient = nodeRedis.makeClient()
    const connectionError = new Error('connection refused')
    firstClient.connect.mockImplementationOnce(async () => {
      firstClient.isOpen = true
      await Promise.resolve()
      firstClient.isOpen = false
      throw connectionError
    })
    firstClient.get.mockResolvedValue('recovered-on-first-client')

    const replacementClient = nodeRedis.makeClient()
    replacementClient.get.mockResolvedValue('recovered-on-replacement-client')
    nodeRedis.createClient
      .mockReturnValueOnce(firstClient)
      .mockReturnValueOnce(replacementClient)

    const redis = getRedis()
    await expect(redis.get('key')).rejects.toBe(connectionError)
    expect(firstClient.destroy).not.toHaveBeenCalled()
    await expect(redis.get('key')).resolves.toBe('recovered-on-replacement-client')

    expect(firstClient.connect).toHaveBeenCalledTimes(1)
    expect(replacementClient.connect).toHaveBeenCalledTimes(1)
    expect(nodeRedis.createClient).toHaveBeenCalledTimes(2)
  })

  it('disposes the shared client on reset and constructs a fresh client on reuse', async () => {
    const firstClient = nodeRedis.makeClient()
    firstClient.get.mockResolvedValue('first')
    const secondClient = nodeRedis.makeClient()
    secondClient.get.mockResolvedValue('second')
    nodeRedis.createClient
      .mockReturnValueOnce(firstClient)
      .mockReturnValueOnce(secondClient)

    const firstRedis = getRedis()
    await expect(firstRedis.get('key')).resolves.toBe('first')

    resetRedisForTests()

    expect(firstClient.destroy.mock.calls.length + firstClient.disconnect.mock.calls.length).toBe(1)
    const secondRedis = getRedis()
    expect(secondRedis).not.toBe(firstRedis)
    await expect(secondRedis.get('key')).resolves.toBe('second')
    expect(nodeRedis.createClient).toHaveBeenCalledTimes(2)
  })

  it('resets an already-closed client without destroying it or throwing', async () => {
    const client = nodeRedis.makeClient()
    client.get.mockResolvedValue('value')
    nodeRedis.createClient.mockReturnValue(client)

    await expect(getRedis().get('key')).resolves.toBe('value')
    client.isOpen = false

    expect(() => resetRedisForTests()).not.toThrow()
    expect(client.destroy).not.toHaveBeenCalled()
  })
})
