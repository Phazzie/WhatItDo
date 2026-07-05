import { test, expect } from '@playwright/test'

// Happy-path smoke for "Classic" (normal) mode: create a poll with two
// suggestions, vote yes/no via the shared link, then confirm both responses
// show up on the results page.
test('classic mode: create, vote yes/no, see results', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: /Classic Mode/i }).click()

  await page.locator('#suggestion-0').fill('Try that new restaurant downtown')
  await page.locator('#suggestion-1').fill('Go hiking this weekend')

  await page.getByRole('button', { name: 'Create Poll & Get Link' }).click()

  await expect(page.getByText('Poll Created!')).toBeVisible()

  const pollLink = await page.locator('p.font-mono').innerText()
  const resultsLink = await page.getByRole('link', { name: 'View Results Page' }).getAttribute('href')
  expect(pollLink).toMatch(/\/vote\//)
  expect(resultsLink).toMatch(/\/results\//)

  await page.goto(pollLink)

  await page.getByRole('button', { name: 'Vote yes for "Try that new restaurant downtown"' }).click()
  await page.getByRole('button', { name: 'Vote no for "Go hiking this weekend"' }).click()

  await page.getByRole('button', { name: 'Submit Votes' }).click()

  await expect(page.getByText('Votes Submitted!')).toBeVisible()

  await page.goto(resultsLink!)

  await expect(page.getByText('1 response')).toBeVisible()
  await expect(page.getByText('Try that new restaurant downtown', { exact: false }).first()).toBeVisible()
  await expect(page.getByText('Go hiking this weekend', { exact: false }).first()).toBeVisible()

  // Both suggestions' recorded votes render in the "All Responses" section.
  const responseCard = page.locator('.card-gradient', { hasText: 'Anonymous' })
  await expect(responseCard.getByText('✅ YES', { exact: true })).toBeVisible()
  await expect(responseCard.getByText('❌ NO', { exact: true })).toBeVisible()
})
