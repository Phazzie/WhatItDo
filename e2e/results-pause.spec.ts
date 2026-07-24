import { expect, test } from '@playwright/test'

const poll = {
  title: 'Pause the tally',
  mode: 'normal',
  suggestions: ['Wait for it'],
  createdAt: 1_700_000_000_000,
  expiresAt: 1_700_000_100_000,
  responses: [],
}

test('pausing auto-refresh stops timed and visibility refreshes but keeps manual refresh available', async ({ page }) => {
  let resultRequests = 0
  await page.route('**/api/results', async (route) => {
    resultRequests += 1
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ poll }) })
  })
  await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') })

  await page.goto(`/results/${'A'.repeat(10)}#${'B'.repeat(24)}`)
  await page.clock.runFor(1)
  await expect(page.getByRole('heading', { name: poll.title })).toBeVisible()
  expect(resultRequests).toBe(1)
  await expect(page.getByText(/^Last updated /)).not.toHaveAttribute('aria-live')

  const autoRefresh = page.getByRole('button', { name: 'Auto-refresh' })
  await expect(autoRefresh).toHaveAttribute('aria-pressed', 'true')
  await autoRefresh.click()
  await expect(autoRefresh).toHaveAttribute('aria-pressed', 'false')

  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.clock.runFor(30_000)
  expect(resultRequests).toBe(1)

  await page.getByRole('button', { name: /Refresh now/i }).click()
  await expect.poll(() => resultRequests).toBe(2)

  await autoRefresh.click()
  await expect(autoRefresh).toHaveAttribute('aria-pressed', 'true')
  await page.clock.runFor(30_000)
  await expect.poll(() => resultRequests).toBe(3)
})

test('leaving results aborts an in-flight private results request', async ({ page }) => {
  let abortCalls = 0
  let resultRequests = 0
  let releaseRequest!: () => void
  const requestReleased = new Promise<void>((resolve) => {
    releaseRequest = resolve
  })

  page.on('console', (message) => {
    if (message.text() === '__WHATITDO_RESULTS_ABORT__') abortCalls += 1
  })
  await page.addInitScript(() => {
    const originalAbort = AbortController.prototype.abort
    const originalFetch = window.fetch.bind(window)
    let resultsRequestActive = false

    window.fetch = (input, init) => {
      const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url
      if (url.includes('/api/results')) resultsRequestActive = true
      return originalFetch(input, init)
    }
    AbortController.prototype.abort = function (...args) {
      if (resultsRequestActive) {
        console.log('__WHATITDO_RESULTS_ABORT__')
        resultsRequestActive = false
      }
      return originalAbort.apply(this, args)
    }
  })
  await page.route('**/api/results', async (route) => {
    resultRequests += 1
    if (resultRequests === 1) {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ poll }) })
      return
    }
    await requestReleased
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ poll }) }).catch(() => {})
  })

  await page.goto(`/results/${'A'.repeat(10)}#${'B'.repeat(24)}`)
  await expect(page.getByRole('heading', { name: poll.title })).toBeVisible()
  const refreshRequest = page.waitForRequest('**/api/results')
  await page.getByRole('button', { name: /Refresh now/i }).click()
  await refreshRequest
  await page.getByRole('link', { name: /WHAT IT DO/i }).click()
  await expect(page).toHaveURL('/')
  releaseRequest()

  await expect.poll(() => abortCalls).toBe(1)
})
