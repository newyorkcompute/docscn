import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.DOCSCN_TEST_URL ?? 'http://localhost:3000';
const reportOutput = '../../playwright-report/apps/web-e2e';

export default defineConfig({
  testDir: './src',
  outputDir: '../../test-results/apps/web-e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: reportOutput }]]
    : [['list'], ['html', { open: 'never', outputFolder: reportOutput }]],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
