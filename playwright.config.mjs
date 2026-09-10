import { defineConfig } from '@playwright/test';
import process from 'node:process';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:5174',
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath: process.env.CHROME_PATH || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined),
    },
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5174',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: true,
  },
});
