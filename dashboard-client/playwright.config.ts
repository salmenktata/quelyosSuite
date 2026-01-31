import { defineConfig, devices } from '@playwright/test'

/**
 * Configuration Playwright pour tests E2E Éditions
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: process.env.VITE_EDITION 
      ? getUrlForEdition(process.env.VITE_EDITION)
      : 'http://localhost:5175',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: process.env.VITE_EDITION 
      ? 'pnpm run dev:' + process.env.VITE_EDITION
      : 'pnpm run dev',
    url: process.env.VITE_EDITION
      ? getUrlForEdition(process.env.VITE_EDITION)
      : 'http://localhost:5175',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})

function getUrlForEdition(edition: string): string {
  const ports: Record<string, number> = {
    finance: 3010,
    store: 3011,
    copilote: 3012,
    sales: 3013,
    retail: 3014,
    team: 3015,
    support: 3016,
    full: 5175,
  }
  const port = ports[edition] || 5175
  return 'http://localhost:' + port
}
