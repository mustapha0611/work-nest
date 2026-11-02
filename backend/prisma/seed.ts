import { hashPassword } from '../src/lib/password.js';
import { loadEnv } from '../src/config/env.js';
import { createPrismaClient } from '../src/lib/prisma.js';

/**
 * Development seed.
 *
 * M4 adds sign-in but not registration — users will join through workspace
 * invitations in M5 — so this creates the one account needed to exercise the
 * login flow by hand. Integration tests do not use it; they create users
 * directly through Prisma.
 *
 * Run with: npm run db:seed -w backend
 */

const DEMO_EMAIL = 'demo@worknest.local';
const DEMO_PASSWORD = 'worknest-demo';

async function main(): Promise<void> {
  const env = loadEnv();

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'Refusing to seed: this script creates an account with a publicly known password.',
    );
  }

  const prisma = createPrismaClient(env.DATABASE_URL);

  try {
    const passwordHash = await hashPassword(DEMO_PASSWORD);

    const user = await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: { passwordHash },
      create: { email: DEMO_EMAIL, passwordHash, displayName: 'Demo User' },
    });

    console.log(`Seeded ${user.email} (password: ${DEMO_PASSWORD}). Local development only.`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
