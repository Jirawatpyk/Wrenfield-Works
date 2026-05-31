import { defineConfig, devices } from '@playwright/test'

/**
 * E2E + WCAG 2.1 AA (axe) journeys. The webServer boots the real app so tests
 * exercise the public site and the back office exactly as a visitor/editor would.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // Each journey does several full navigations against the production server (cold first
  // paint per page). 30s is tight under parallel load; 60s keeps them deterministic.
  timeout: 60_000,
  // Single worker: many parallel Chromium pages + the Next prod server saturate CPU and make
  // multi-navigation journeys exceed the timeout. One worker keeps the suite deterministic
  // (the lattice canvases are CPU-heavy); the full suite still runs in ~2 min.
  workers: 1,
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
