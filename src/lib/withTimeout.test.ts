import { afterEach, describe, expect, it, vi } from 'vitest'
import { withTimeout } from './withTimeout'

describe('withTimeout', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('returns a provider result received before the deadline and clears the timer', async () => {
    vi.useFakeTimers()
    const result = withTimeout(Promise.resolve('sent'), 5_000)

    await expect(result).resolves.toBe('sent')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('returns a provider rejection received before the deadline and clears the timer', async () => {
    vi.useFakeTimers()
    const failure = new Error('provider rejected')
    const result = withTimeout(Promise.reject(failure), 5_000)

    await expect(result).rejects.toBe(failure)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('rejects at the deadline and clears the elapsed timer', async () => {
    vi.useFakeTimers()
    const result = withTimeout(new Promise<never>(() => undefined), 5_000)
    const assertion = expect(result).rejects.toThrow('Operation timed out after 5000ms')

    await vi.advanceTimersByTimeAsync(5_000)

    await assertion
    expect(vi.getTimerCount()).toBe(0)
  })

  it('consumes a provider rejection that arrives after the timeout', async () => {
    vi.useFakeTimers()
    let rejectProvider: (error: Error) => void = () => undefined
    const provider = new Promise<never>((_resolve, reject) => {
      rejectProvider = reject
    })
    const result = withTimeout(provider, 5_000)
    const assertion = expect(result).rejects.toThrow('Operation timed out after 5000ms')

    await vi.advanceTimersByTimeAsync(5_000)
    await assertion
    rejectProvider(new Error('late provider failure'))
    await Promise.resolve()

    expect(vi.getTimerCount()).toBe(0)
  })
})
