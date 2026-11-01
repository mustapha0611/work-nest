import { execSync } from 'node:child_process';

import { resolveTestDatabaseUrl } from './test-env.js';

/**
 * Brings `worknest_test` up to the current schema before the suite runs.
 *
 * `migrate deploy` rather than `migrate dev`: the test database is disposable,
 * and replaying the committed migrations is also the cheapest proof that they
 * work from an empty database. A drift between the schema and the migrations
 * shows up here rather than in production.
 */
export default function setup(): void {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    // The Prisma CLI reads DATABASE_URL; the tests read TEST_DATABASE_URL.
    env: { ...process.env, DATABASE_URL: resolveTestDatabaseUrl() },
  });
}
