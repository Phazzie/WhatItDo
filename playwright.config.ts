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
  workers: process.env.CI ? undefined : 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    extraHTTPHeaders: {
      // The production server intentionally rejects requests without a trusted
      // client identity. This header is accepted only because the local test
      // server opts into TRUST_PROXY below.
      'x-forwarded-for': '127.0.0.1',
    },
    trace: 'retain-on-failure',
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      ...(process.platform === 'darwin' ? { args: ['--disable-gpu'] } : {}),
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Use a production build so the in-process E2E store survives navigation
    // across route bundles. The application permits this store only for an
    // explicit loopback E2E run with no deployment marker.
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 540_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      E2E_TEST: '1',
      E2E_BASE_URL: `http://127.0.0.1:${PORT}`,
      TRUST_PROXY: '1',
    },
  },
})
