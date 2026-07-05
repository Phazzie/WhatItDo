import { test, expect } from '@playwright/test'

// Happy-path smoke for "Dubious" mode (the app's default): create a poll
// with a single suggestion, vote YOLO via the shared link and add a counter
// proposal, then confirm the results page shows the YOLO count and the
// counter proposal text.
test('dubious mode: create, YOLO vote + counter proposal, see results', async ({ page }) => {
  await page.goto('/')

  // Dubious mode is the default — no toggle click needed.
  await page.locator('#suggestion-0').fill('Send a mysterious message to someone intriguing')

  await page.getByRole('button', { name: 'Send the Invitation' }).click()

  await expect(page.getByText('Poll Created!')).toBeVisible()

  const pollLink = await page.locator('p.font-mono').innerText()
  const resultsLink = await page.getByRole('link', { name: 'View Results Page' }).getAttribute('href')
  expect(pollLink).toMatch(/\/vote\//)
  expect(resultsLink).toMatch(/\/results\//)

  await page.goto(pollLink)

  await page.getByRole('button', { name: 'Vote YOLO for "Send a mysterious message to someone intriguing"' }).click()
  await page.locator('#counter-proposal').fill('Or perhaps a spontaneous rooftop picnic instead')

  await page.getByRole('button', { name: 'Submit Votes' }).click()

  await expect(page.getByText('Votes Submitted!')).toBeVisible()

  await page.goto(resultsLink!)

  await expect(page.getByText('1 response')).toBeVisible()
  await expect(page.getByText('DUBIOUS MODE')).toBeVisible()

  // Vote summary shows the YOLO count for the single suggestion.
  await expect(page.getByText('yolo', { exact: false }).first()).toBeVisible()

  // Counter proposal surfaces in the dedicated "Alternative Suggestions" section.
  await expect(page.getByText('Alternative Suggestions')).toBeVisible()
  await expect(page.getByText('Or perhaps a spontaneous rooftop picnic instead', { exact: false }).first()).toBeVisible()
})
