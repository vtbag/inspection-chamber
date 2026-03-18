import { defineConfig, devices } from '@playwright/test';

declare const process: {
  env: Record<string, string | undefined>;
};

const isCI = !!process.env.CI;
const wslDistro = process.env.PW_WSL_DISTRO ?? 'Ubuntu-24.04';
const wslProjectDir =
  process.env.PW_WSL_PROJECT_DIR ?? '/home/martrapp/public/inspection-chamber';

const fallbackCanary = 'C:\\Users\\martrapp\\AppData\\Local';
const localAppData = process.env.LOCALAPPDATA ?? fallbackCanary;
const canaryExecutable =
  process.env.PW_CHROME_CANARY_PATH ??
  `${localAppData}\\Google\\Chrome SxS\\Application\\chrome.exe`;

const wslWebServerCommand = `wsl.exe -d ${wslDistro} bash -lc \"cd ${wslProjectDir} && npm run start\"`;

export default defineConfig({
  testDir: './src/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  timeout: 10_000,
  expect: {
    timeout: 7_000,
  },
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results/playwright',
  use: {
    baseURL: 'http://127.0.0.1:4321',
    headless: true,
    viewport: { width: 1366, height: 900 },
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'light',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: wslWebServerCommand,
    port: 4321,
    timeout: 120 * 1000,
    reuseExistingServer: !isCI,
  },
  projects: [
    {
      name: 'chrome-canary',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: canaryExecutable,
        },
      },
    },
  ],
});
