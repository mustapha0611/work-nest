import { defineConfig } from 'vitest/config';

/**
 * Configuration for the database integration tests.
 *
 * Kept separate from `vitest.config.ts` so `npm test` never needs Docker. These
 * tests run through `npm run test:db`, which also applies migrations to the
 * disposable `worknest_test` database first.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.db.test.ts'],
    globalSetup: ['./src/test/db/global-setup.ts'],
    // The tests share one database and truncate between cases, so files must
    // not run in parallel.
    fileParallelism: false,
    restoreMocks: true,
    clearMocks: true,
  },
});
