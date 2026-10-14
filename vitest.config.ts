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
  },
});
