import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

/**
 * Resolves the database the integration tests run against.
 *
 * Precedence is environment first, `.env` second, the same rule
 * `prisma.config.ts` follows: a CI run or a one-off shell override must win
 * over the local file. Node's built-in loader keeps the app scripts, the Prisma
 * CLI and this harness on one mechanism.
 */
export function resolveTestDatabaseUrl(): string {
  if (!process.env.TEST_DATABASE_URL && existsSync('.env')) {
    loadEnvFile('.env');
  }

  const url = process.env.TEST_DATABASE_URL;

  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL is not set. Copy the value from .env.example into backend/.env.',
    );
  }

  assertIsTestDatabase(url);

  return url;
}

/**
 * Refuses to run the suite against anything but a throwaway database.
 *
 * The tests truncate every table. If a configuration mistake pointed them at
 * the development database, they would erase real local work without any
 * warning — so the guard fails loudly instead. Only the database name is
 * reported; the URL carries credentials and must not reach a log.
 */
export function assertIsTestDatabase(url: string): void {
  let databaseName: string;

  try {
    databaseName = new URL(url).pathname.replace(/^\//, '');
  } catch {
    throw new Error('The database URL for tests is not a valid URL.');
  }

  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Refusing to run database tests against "${databaseName}": the database name must end with "_test".`,
    );
  }
}
