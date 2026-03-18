import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isCI = !!process.env.CI;
const isWindows = process.platform === 'win32';
const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Windows-only: start the dev server inside WSL and use Chrome Canary.
// Derive distro and project path from the config file directory's UNC path automatically.
// e.g. \\wsl$\Ubuntu-24.04\home\user\project  →  distro='Ubuntu-24.04', posixPath='/home/user/project'
const _wslMatch = currentDir.match(/^\\\\wsl\$\\([^\\]+)(\\.*)?$/i);
const wslDistro = process.env.PW_WSL_DISTRO ?? (_wslMatch?.[1] ?? 'Ubuntu-24.04');
const wslProjectDir =
  process.env.PW_WSL_PROJECT_DIR ??
  (_wslMatch?.[2]?.replace(/\\/g, '/') ?? '/home/user/public/inspection-chamber');
// LOCALAPPDATA is always set on Windows; USERPROFILE is the reliable fallback.
const localAppData =
  process.env.LOCALAPPDATA ?? `${process.env.USERPROFILE}\\AppData\\Local`;
const canaryExecutable =
  process.env.PW_CHROME_CANARY_PATH ??
  `${localAppData}\\Google\\Chrome SxS\\Application\\chrome.exe`;
const wslWebServerCommand = `wsl.exe -d ${wslDistro} bash -lc "cd ${wslProjectDir} && npm run start"`;

export default defineConfig({
  testDir: './src/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : 1,
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
    command: isWindows ? wslWebServerCommand : 'npm run start',
    port: 4321,
    timeout: 120 * 1000,
    reuseExistingServer: !isCI,
  },
  projects: isWindows
    ? [
        {
          name: 'chrome-canary',
          use: {
            ...devices['Desktop Chrome'],
            launchOptions: { executablePath: canaryExecutable },
          },
        },
      ]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
      ],
});