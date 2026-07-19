export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(new Error(`Operation timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    // Keep both handlers attached after a timeout. In particular, the rejection
    // handler consumes a provider failure that arrives after our caller has
    // already received the timeout error.
    promise.then(
      (value) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}
