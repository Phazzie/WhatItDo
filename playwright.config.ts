import { defineConfig, devices } from '@playwright/test'
import fs from 'node:fs'

// The agent sandbox pre-installs Chromium at /opt/pw-browsers and skips the
// normal Playwright download step (PLAYWRIGHT_BROWSERS_PATH +
// PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 are set in that environment). CI has no
// such pre-install and instead runs `npx playwright install --with-deps
// chromium`, which puts the browser in Playwright's default managed
// location — so only override `executablePath` when the sandbox path exists.
const SANDBOX_CHROMIUM = '/opt/pw-browsers/chromium'
const executablePath = fs.existsSync(SANDBOX_CHROMIUM) ? SANDBOX_CHROMIUM : undefined

const PORT = 3100

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // `next dev` recompiles route bundles on demand as different pages are
    // first visited; in this app that on-demand recompile has been observed
    // to reset the in-process `USE_MOCK_REDIS` singleton mid-run (a poll
    // created via the create page 404s once the vote page's bundle first
    // compiles). A production build + `next start` has one stable bundle for
    // the whole run, so state survives navigation across routes.
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      USE_MOCK_REDIS: '1',
    },
  },
})
