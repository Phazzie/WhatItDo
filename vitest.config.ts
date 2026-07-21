import { configDefaults, defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    fileParallelism: false,
    // e2e/** holds Playwright specs (also matched by vitest's default
    // *.spec.ts glob) — exclude them so `vitest run` doesn't try to execute
    // Playwright's `test()` outside a Playwright runner (Wave 3.1).
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/app/api/**/*.ts', 'src/lib/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/test/**'],
      thresholds: { lines: 85, functions: 85, statements: 85, branches: 80 },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
