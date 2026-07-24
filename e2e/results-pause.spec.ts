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

  const autoRefresh = page.getByRole('button', { name: 'Pause auto-refresh' })
  await autoRefresh.click()
  await expect(autoRefresh).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Resume auto-refresh' })).toBeVisible()

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
})
