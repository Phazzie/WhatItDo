import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'

type PollMode = 'normal' | 'dubious'

interface CreatedLinks {
  pollId: string
  resultsUrl: string
  voteUrl: string
}

function loopbackIpFor(testId: string) {
  let hash = 2166136261
  for (const character of testId) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  const suffix = hash >>> 0
  return `127.${(suffix >>> 16) & 255}.${(suffix >>> 8) & 255}.${suffix & 255}`
}

test.beforeEach(async ({ page }, testInfo) => {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': loopbackIpFor(testInfo.testId) })
})

function appAlert(page: Page) {
  return page.locator('.notice[role="alert"]')
}

async function createPoll(
  page: Page,
  { mode, title, suggestions }: { mode: PollMode; title: string; suggestions: string[] }
): Promise<CreatedLinks> {
  await page.goto('/')

  if (mode === 'normal') {
    await page.getByRole('button', { name: /Classic/i }).click()
  }

  await page.getByLabel(/Name the dilemma/i).fill(title)
  const options = page.getByRole('group', { name: /Possible moves/i }).getByRole('textbox')
  for (const [index, suggestion] of suggestions.entries()) {
    await options.nth(index).fill(suggestion)
  }
  await page.getByRole('button', { name: /Make the poll/i }).click()

  await expect(page.getByRole('heading', { name: /Poll alive/i })).toBeVisible()
  const voteOutput = page.locator('article').filter({ hasText: 'Public voting link' }).locator('output')
  const resultsOutput = page.locator('article').filter({ hasText: 'Private owner link' }).locator('output')
  await expect(voteOutput).toContainText('/vote/')
  await expect(resultsOutput).toContainText('/results/')

  const voteUrl = (await voteOutput.textContent())!.trim()
  const resultsUrl = (await resultsOutput.textContent())!.trim()
  const vote = new URL(voteUrl)
  const results = new URL(resultsUrl)

  expect(vote.hash).toBe('')
  expect(vote.pathname).toMatch(/^\/vote\/[A-Za-z0-9_-]{10}$/)
  expect(results.pathname).toBe(vote.pathname.replace('/vote/', '/results/'))
  expect(results.hash).toMatch(/^#[A-Za-z0-9_-]{24}$/)
  expect(resultsUrl).not.toBe(voteUrl)

  return {
    pollId: vote.pathname.split('/').at(-1)!,
    resultsUrl,
    voteUrl,
  }
}

async function choose(page: Page, suggestion: string, vote: 'Yes' | 'Maybe' | 'Nope' | 'YOLO') {
  await page.getByRole('group', { name: suggestion, exact: true }).getByRole('button', { name: vote, exact: true }).click()
}

async function assertNoSeriousAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(
    violations,
    violations.map(({ id, impact, nodes }) => `${impact ?? 'unknown'} ${id}: ${nodes.length} node(s)`).join('\n')
  ).toEqual([])
}

async function assertNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
}

async function tabToVisibleFocusRing(page: Page, locator: Locator) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await page.keyboard.press('Tab')
    if (await locator.evaluate((element) => element === document.activeElement)) {
      await expect(locator).toBeFocused()
      const outline = await locator.evaluate((element) => {
        const style = window.getComputedStyle(element)
        return {
          style: style.outlineStyle,
          width: Number.parseFloat(style.outlineWidth),
          offset: Number.parseFloat(style.outlineOffset),
        }
      })
      expect(outline.style).toBe('solid')
      expect(outline.width).toBeGreaterThanOrEqual(3)
      expect(outline.offset).toBeGreaterThanOrEqual(2)
      return
    }
  }
  throw new Error(`Keyboard focus did not reach ${locator}`)
}

test('Classic: creates separate links, records a ballot, and unlocks owner results', async ({ page }) => {
  const title = 'Friday night council'
  const first = 'Try the tiny dumpling spot'
  const second = 'Go stargazing Friday'
  const links = await createPoll(page, { mode: 'normal', title, suggestions: [first, second] })

  await page.goto(links.voteUrl)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await choose(page, first, 'Yes')
  await choose(page, second, 'Nope')
  await page.getByLabel(/Your alias/i).fill('Night Owl')
  await page.getByLabel(/Margin note/i).first().fill('Book the corner table')
  await page.getByRole('button', { name: /Seal my ballot/i }).click()

  await expect(page.getByRole('heading', { name: /Your vote is in/i })).toBeVisible()
  await expect(page.getByRole('status')).toContainText(
    'Email alerts are not configured, but your response is safe.'
  )

  await page.goto(links.resultsUrl)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await expect(page.getByLabel('1 response')).toContainText('01')
  await expect(page.getByRole('heading', { name: 'Individual ballots' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Night Owl' })).toBeVisible()
  await expect(page.getByText('Book the corner table')).toBeVisible()
})

test('Dubious: offers YOLO and surfaces a rogue alternative', async ({ page }) => {
  const title = 'Questionable field trip'
  const suggestion = 'Take a midnight road trip'
  const alternative = 'Charter a tiny boat at dawn'
  const links = await createPoll(page, { mode: 'dubious', title, suggestions: [suggestion] })

  await page.goto(links.voteUrl)
  await expect(page.getByText('DUBIOUS BALLOT')).toBeVisible()
  await choose(page, suggestion, 'YOLO')
  await page.getByLabel(/Plot twist/i).fill(alternative)
  await page.getByRole('button', { name: /Seal my ballot/i }).click()
  await expect(page.getByRole('heading', { name: /Your vote is in/i })).toBeVisible()

  await page.goto(links.resultsUrl)
  await expect(page.getByText('YOLO leads')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Rogue alternatives' })).toBeVisible()
  await expect(page.getByText(alternative)).toBeVisible()
})

test('private results reveal no poll data without the exact URL fragment', async ({ page }) => {
  const title = 'Do not leak this title'
  const links = await createPoll(page, { mode: 'normal', title, suggestions: ['Secret option'] })
  const results = new URL(links.resultsUrl)

  await page.goto(results.origin + results.pathname)
  await expect(page.getByRole('heading', { name: 'The archive stayed shut.' })).toBeVisible()
  await expect(page.locator('.state-card').getByRole('alert')).toContainText('missing its private key')
  await expect(page.getByText(title)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Individual ballots' })).toHaveCount(0)
  await assertNoSeriousAxeViolations(page)

  await page.goto(`${results.origin}${results.pathname}#${'A'.repeat(24)}`)
  await expect(page.getByRole('heading', { name: 'Key not accepted.' })).toBeVisible()
  await expect(page.getByText(title)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Individual ballots' })).toHaveCount(0)
  await assertNoSeriousAxeViolations(page)
})

test('created links remain available when browser storage rejects writes', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Storage is disabled', 'SecurityError')
    }
  })

  const links = await createPoll(page, {
    mode: 'normal',
    title: 'No storage, no problem',
    suggestions: ['Keep both links visible'],
  })

  await expect(page.getByText(links.voteUrl, { exact: true })).toBeVisible()
  await expect(page.getByText(links.resultsUrl, { exact: true })).toBeVisible()
  await expect(appAlert(page)).toContainText('could not save it in this browser')
})

test('a stale results request cannot reveal data after the private fragment changes', async ({ page }) => {
  const title = 'Fragment race secret'
  const links = await createPoll(page, { mode: 'normal', title, suggestions: ['Stay private'] })
  const correctToken = new URL(links.resultsUrl).hash.slice(1)
  let delayed = true

  await page.route('**/api/results', async (route) => {
    const body = route.request().postDataJSON() as { resultsToken?: string }
    if (delayed && body.resultsToken === correctToken) {
      delayed = false
      await new Promise((resolve) => setTimeout(resolve, 350))
    }
    await route.continue().catch(() => undefined)
  })

  const firstRequest = page.waitForRequest((request) => {
    if (!request.url().endsWith('/api/results')) return false
    return (request.postDataJSON() as { resultsToken?: string }).resultsToken === correctToken
  })
  await page.goto(links.resultsUrl)
  await firstRequest
  await page.evaluate(() => { window.location.hash = `#${'A'.repeat(24)}` })

  await expect(page.getByRole('heading', { name: 'Key not accepted.' })).toBeVisible()
  await page.waitForTimeout(450)
  await expect(page.getByText(title)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Individual ballots' })).toHaveCount(0)
})

test('ballot offers a retry after a transient load failure', async ({ page }) => {
  const title = 'Recoverable ballot'
  const links = await createPoll(page, { mode: 'normal', title, suggestions: ['Try once more'] })
  let firstLoad = true

  await page.route(`**/api/poll?id=${links.pollId}`, async (route) => {
    if (firstLoad) {
      firstLoad = false
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'offline' }) })
      return
    }
    await route.continue()
  })

  await page.goto(links.voteUrl)
  await expect(page.getByRole('heading', { name: 'The ballot booth is offline.' })).toBeVisible()
  await assertNoSeriousAxeViolations(page)
  await page.getByRole('button', { name: 'Try the ballot again' }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
})

test('results show freshness and recover from a transient refresh failure', async ({ page }) => {
  const links = await createPoll(page, { mode: 'normal', title: 'Refresh recovery', suggestions: ['Try the tally again'] })
  await page.goto(links.resultsUrl)
  await expect(page.getByText(/^Last updated /)).toBeVisible()

  let failRefresh = true
  await page.route('**/api/results', async (route) => {
    if (failRefresh) {
      failRefresh = false
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'temporary outage' }) })
      return
    }
    await route.continue()
  })

  await page.getByRole('button', { name: /Refresh now/i }).click()
  await expect(appAlert(page)).toContainText('temporary outage')
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(appAlert(page)).toHaveCount(0)
  await expect(page.getByText(/^Last updated /)).toBeVisible()
})

test('keyboard form submission exposes create and vote validation errors', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel(/Name the dilemma/i).focus()
  await page.keyboard.press('Enter')
  await expect(appAlert(page)).toContainText('at least one possibility')

  const links = await createPoll(page, { mode: 'normal', title: 'Keyboard validation', suggestions: ['Pick me'] })
  await page.goto(links.voteUrl)
  await page.getByRole('button', { name: /Choose 1 more/i }).focus()
  await page.keyboard.press('Enter')
  await expect(appAlert(page)).toContainText('Choose one response for every possibility')
})

test('forced-colors focus stays visible on links, buttons, inputs, and textareas', async ({ page }) => {
  const suggestion = 'Keep the outline'
  const links = await createPoll(page, {
    mode: 'normal',
    title: 'Visible focus proof',
    suggestions: [suggestion],
  })

  await page.emulateMedia({ forcedColors: 'active' })
  await page.goto(links.voteUrl)
  await expect(page.getByRole('heading', { name: 'Visible focus proof' })).toBeVisible()
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true)

  const controls = [
    page.getByRole('link', { name: /What It Do/i }),
    page.getByLabel(/Your alias/i),
    page.getByRole('group', { name: suggestion, exact: true })
      .getByRole('button', { name: 'Yes', exact: true }),
    page.getByLabel(/Margin note/i),
    page.getByLabel(/Plot twist/i),
  ]
  for (const control of controls) await tabToVisibleFocusRing(page, control)
})

for (const [notification, copy] of [
  ['sent', 'email alert was accepted for delivery'],
  ['failed', 'email alert fizzled, but your response is safe'],
] as const) {
  test(`vote receipt explains the ${notification} notification state`, async ({ page }) => {
    const suggestion = `Notification ${notification}`
    const links = await createPoll(page, { mode: 'normal', title: `${notification} notice`, suggestions: [suggestion] })
    await page.route('**/api/vote', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, notification }),
      })
    })
    await page.goto(links.voteUrl)
    await choose(page, suggestion, 'Yes')
    await page.getByRole('button', { name: /Seal my ballot/i }).click()
    await expect(page.getByRole('status')).toContainText(copy)
  })
}

test('the not-found page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/this-route-does-not-exist')
  await expect(page.getByRole('heading')).toBeVisible()
  await assertNoSeriousAxeViolations(page)
})

test('an ambiguous vote retry reuses the exact payload and receipt', async ({ page }) => {
  const suggestion = 'Keep the original choice'
  const links = await createPoll(page, { mode: 'normal', title: 'Frozen receipt', suggestions: [suggestion] })
  const attempts: unknown[] = []

  await page.route('**/api/vote', async (route) => {
    attempts.push(route.request().postDataJSON())
    if (attempts.length === 1) {
      await route.fetch()
      await route.abort('failed')
      return
    }
    await route.continue()
  })

  await page.goto(links.voteUrl)
  await choose(page, suggestion, 'Yes')
  await page.getByLabel(/Your alias/i).fill('Original Voter')
  await page.getByRole('button', { name: /Seal my ballot/i }).click()
  await expect(appAlert(page)).toBeVisible()

  await choose(page, suggestion, 'Nope')
  await page.getByLabel(/Your alias/i).fill('Edited Voter')
  await page.getByRole('button', { name: /Seal my ballot/i }).click()

  await expect(page.getByRole('heading', { name: /Your vote is in/i })).toBeVisible()
  await expect(page.locator('.receipt')).toContainText(`YES — ${suggestion}`)
  expect(attempts).toHaveLength(2)
  expect(attempts[1]).toEqual(attempts[0])
})

test('retrying one stable submission records exactly one response', async ({ page, request }) => {
  const suggestion = 'Order noodles'
  const links = await createPoll(page, {
    mode: 'normal',
    title: 'Idempotent supper',
    suggestions: [suggestion],
  })
  const payload = {
    pollId: links.pollId,
    submissionId: '11111111-1111-4111-8111-111111111111',
    voterName: 'Reliable Retry',
    votes: [{ text: suggestion, vote: 'yes', comment: '' }],
  }

  const first = await request.post('/api/vote', { data: payload })
  expect(first.ok()).toBe(true)
  expect(await first.json()).toEqual({ success: true, notification: 'not_configured' })
  const duplicate = await request.post('/api/vote', { data: payload })
  expect(duplicate.ok()).toBe(true)
  expect(await duplicate.json()).toEqual({ success: true, notification: 'duplicate' })

  await page.goto(links.resultsUrl)
  await expect(page.getByLabel('1 response')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Reliable Retry' })).toHaveCount(1)
})

test('home, ballot, and owner results are accessible and fit a 375px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Stop circling/i })).toBeVisible()
  await assertNoHorizontalOverflow(page)
  await assertNoSeriousAxeViolations(page)

  const title = 'T'.repeat(100)
  const suggestion = 'S'.repeat(200)
  const links = await createPoll(page, { mode: 'normal', title, suggestions: [suggestion] })
  await page.goto(links.voteUrl)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await assertNoHorizontalOverflow(page)
  await assertNoSeriousAxeViolations(page)

  await choose(page, suggestion, 'Yes')
  await page.getByLabel(/Your alias/i).fill('N'.repeat(50))
  await page.getByLabel(/Margin note/i).fill('C'.repeat(200))
  await page.getByLabel(/Plot twist/i).fill('P'.repeat(500))
  await page.getByRole('button', { name: /Seal my ballot/i }).click()
  await expect(page.getByRole('heading', { name: /Your vote is in/i })).toBeVisible()
  await assertNoHorizontalOverflow(page)

  await page.goto(links.resultsUrl)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await assertNoHorizontalOverflow(page)
  await assertNoSeriousAxeViolations(page)
})
