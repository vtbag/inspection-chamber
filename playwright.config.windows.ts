import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

declare const process: {
  env: Record<string, string | undefined>;
};

const isCI = !!process.env.CI;
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const wslMatch = currentDir.match(/^\\\\wsl\$\\([^\\]+)(\\.*)?$/i);
const wslDistro = process.env.PW_WSL_DISTRO ?? (wslMatch?.[1] ?? 'Ubuntu-24.04');
const wslProjectDir =
  process.env.PW_WSL_PROJECT_DIR ??
  (wslMatch?.[2]?.replace(/\\/g, '/') ?? '/home/user/public/inspection-chamber');

const fallbackCanary = `${process.env.USERPROFILE ?? 'C:\\Users\\Public'}\\AppData\\Local`;
const localAppData = process.env.LOCALAPPDATA ?? fallbackCanary;
const canaryExecutable =
  process.env.PW_CHROME_CANARY_PATH ??
  `${localAppData}\\Google\\Chrome SxS\\Application\\chrome.exe`;

const webServerCwd = process.env.PW_WEBSERVER_CWD ?? process.env.USERPROFILE ?? 'C:\\';
const wslWebServerCommand = `wsl.exe -d ${wslDistro} bash -lc "cd ${wslProjectDir} && npm run start"`;

console.log('Canary executable path:', canaryExecutable);

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
    cwd: webServerCwd,
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
