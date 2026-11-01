import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Database tests need a live PostgreSQL and run through `npm run test:db`.
    // Excluding them keeps the default suite fast and Docker-free.
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.db.test.ts'],
    restoreMocks: true,
    clearMocks: true,
  },
});
