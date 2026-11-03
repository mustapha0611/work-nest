import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

import { defineConfig, env } from 'prisma/config';

/**
 * Prisma CLI configuration.
 *
 * Prisma 7 no longer reads `.env` by itself once a config file exists, so the
 * file has to be loaded here. `process.loadEnvFile` is Node's built-in loader,
 * which is the same mechanism the app scripts already use (`--env-file=.env`),
 * so local configuration stays in one file and one mechanism with no extra
 * dependency.
 *
 * Paths below are relative to the directory the CLI runs in, which is
 * `backend/` because every Prisma script is an npm workspace script.
 *
 * A `DATABASE_URL` already present in the environment wins over the file, so a
 * test run or a deployment can point the same config at another database
 * without editing `.env`.
 */
if (!process.env.DATABASE_URL && existsSync('.env')) {
  loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Development-only demo account; see prisma/seed.ts.
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // `env()` throws a readable error if DATABASE_URL is missing, rather than
    // letting Prisma attempt a connection to an empty string.
    url: env('DATABASE_URL'),
  },
});
