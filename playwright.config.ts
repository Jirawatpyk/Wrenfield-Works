import { defineConfig, devices } from '@playwright/test'

/**
 * E2E + WCAG 2.1 AA (axe) journeys. The webServer boots the real app so tests
 * exercise the public site and the back office exactly as a visitor/editor would.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000/en',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
