import { defineConfig } from 'vitest/config';

// Три набори тестів: модульні (server, client) та інтеграційні (server: API + SQLite).
// Набір client-unit описано в client/vite.config.ts.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'server-unit',
          root: './server',
          include: ['test/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'server-integration',
          root: './server',
          include: ['test/integration/**/*.test.ts'],
          environment: 'node',
        },
      },
      './client/vite.config.ts',
    ],
    // Покриття коду модульними та інтеграційними тестами: npm run test:coverage → coverage/index.html
    coverage: {
      provider: 'v8',
      include: ['shared/src/**', 'server/src/**', 'client/src/**'],
      exclude: [
        'server/src/index.ts', // точка входу: запуск HTTP-сервера
        'server/src/seed/run.ts', // CLI-скрипт npm run seed
        'client/src/main.tsx', // монтування React у DOM
        '**/*.css',
      ],
      reporter: [['text', { skipFull: false }], 'html', 'json-summary'],
      reportsDirectory: './coverage',
      // Мінімум для серверної логіки: CI падає, якщо покриття ядра просяде
      thresholds: {
        'server/src/{domain,repo,services,api}/**': { lines: 90, branches: 75, functions: 85 },
      },
    },
  },
});
