import { defineConfig, devices } from '@playwright/test';

export const ADMIN_KEY = 'e2e-admin-key';
const APP_PORT = 3100;
const OSRM_PORT = 5999;

// E2E: справжній браузер + зібраний клієнт + сервер + SQLite.
// Зовнішній OSRM підмінено локальною заглушкою, щоб тести були стабільними і не навантажували FOSSGIS.
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    viewport: { width: 1440, height: 900 },
    locale: 'uk-UA',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: [
    {
      command: 'npx tsx support/fake-osrm.ts',
      url: `http://127.0.0.1:${OSRM_PORT}/health`,
      env: { OSRM_PORT: String(OSRM_PORT) },
      reuseExistingServer: false,
    },
    {
      command:
        "npm run build -w @lcn/client && node -e \"require('fs').rmSync('.tmp',{recursive:true,force:true})\" && npx tsx ../server/src/index.ts",
      url: `http://127.0.0.1:${APP_PORT}/api/health`,
      timeout: 120_000,
      env: {
        PORT: String(APP_PORT),
        DB_FILE: 'e2e/.tmp/e2e.db',
        ADMIN_KEY,
        PARTNER_KEYS: 'opera:e2e-partner-key',
        OSRM_URL: `http://127.0.0.1:${OSRM_PORT}`,
      },
      reuseExistingServer: false,
    },
  ],
});
