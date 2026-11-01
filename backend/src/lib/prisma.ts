import { PrismaPg } from '@prisma/adapter-pg';

import { loadEnv } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Creates a Prisma client bound to one database.
 *
 * Prisma 7 talks to PostgreSQL through a driver adapter instead of a bundled
 * query engine, so the connection details go to `PrismaPg`, which owns the `pg`
 * connection pool. The URL is a parameter rather than a read from the
 * environment so a test can point the same code at `worknest_test` without
 * mutating global state.
 */
export function createPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}

let client: PrismaClient | undefined;

/**
 * Returns the process-wide client, creating it on first use.
 *
 * Lazily, not at import time: importing a module should not open connections,
 * and an unusable `DATABASE_URL` should surface inside the startup `try/catch`
 * in `server.ts` rather than as an unhandled error while modules are evaluated.
 */
export function getPrismaClient(): PrismaClient {
  client ??= createPrismaClient(loadEnv().DATABASE_URL);
  return client;
}

/**
 * Closes the pool. Safe to call when nothing was ever opened, which is the
 * normal case for the API until a feature queries the database.
 */
export async function disconnectPrismaClient(): Promise<void> {
  const open = client;
  client = undefined;

  if (open) {
    await open.$disconnect();
  }
}
