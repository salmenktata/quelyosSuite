/**
 * Playwright E2E testing configuration - Backoffice
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Sequential pour éviter conflits DB
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 1 worker pour tests avec DB Odoo
  reporter: 'html',
  timeout: 30 * 1000, // 30s par test

  use: {
    baseURL: 'http://localhost:5175', // Vite dev server backoffice
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5175',
    reuseExistingServer: true, // Utiliser le serveur existant
    timeout: 120 * 1000,
  },
});
