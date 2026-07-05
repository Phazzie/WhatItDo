import { configDefaults, defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    // e2e/** holds Playwright specs (also matched by vitest's default
    // *.spec.ts glob) — exclude them so `vitest run` doesn't try to execute
    // Playwright's `test()` outside a Playwright runner (Wave 3.1).
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
