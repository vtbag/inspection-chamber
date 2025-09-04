import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'npm run start', // or your server start command
    port: 4321,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});