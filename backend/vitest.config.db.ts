import { defineConfig } from 'vitest/config';

import { resolveTestDatabaseUrl } from './src/test/db/test-env.js';

/**
 * Configuration for the database integration tests.
 *
 * Kept separate from `vitest.config.ts` so `npm test` never needs Docker. These
 * tests run through `npm run test:db`, which also applies migrations to the
 * disposable `worknest_test` database first.
 *
 * `env` points the whole application at the test database: the code under test
 * reads `DATABASE_URL` through `loadEnv()`, exactly as it does in production,
 * so the tests exercise the real path instead of a bypass.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.db.test.ts'],
    globalSetup: ['./src/test/db/global-setup.ts'],
    env: { DATABASE_URL: resolveTestDatabaseUrl() },
    // The tests share one database and truncate between cases, so files must
    // not run in parallel.
    fileParallelism: false,
    restoreMocks: true,
    clearMocks: true,
  },
});
