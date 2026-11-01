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

  return url;
}
