import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import { loadEnv, type Env } from '../../config/env.js';
import { createLogger } from '../../lib/logger.js';
import { hashPassword } from '../../lib/password.js';
import { createPrismaClient, disconnectPrismaClient } from '../../lib/prisma.js';
import { hashSessionToken } from '../../lib/session-token.js';
import { resolveTestDatabaseUrl } from './test-env.js';

/**
 * Integration tests for the M4 authentication boundary.
 *
 * These drive the real Express stack through Supertest and a real PostgreSQL,
 * because the interesting failures live in the seams: cookie handling, the
 * session lookup, expiry, and the rate limiter. A mocked request would happily
 * agree with a broken implementation.
 *
 * Run with `npm run test:db -w backend`, never `npm test`.
 */
const prisma = createPrismaClient(resolveTestDatabaseUrl());

const PASSWORD = 'correct horse battery staple';
const SESSION_TTL_DAYS = 7;
const MILLISECONDS_PER_DAY = 86_400_000;

let passwordHash: string;

/**
 * Deletion order is children first. Sessions reference users, so they go before
 * them; the rest matches `schema.db.test.ts`.
 */
async function resetDatabase(): Promise<void> {
  await prisma.session.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();
}

interface TestApp {
  app: ReturnType<typeof createApp>;
  env: Env;
}

/**
 * A fresh app per test, on purpose: the rate limiters keep their counters in
 * the app instance, so reusing one app would leak attempts between cases and
 * make the suite order-dependent.
 */
function buildApp(overrides: Partial<NodeJS.ProcessEnv> = {}): TestApp {
  const env = loadEnv({
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    APP_ORIGIN: 'http://localhost:4200',
    DATABASE_URL: resolveTestDatabaseUrl(),
    SESSION_TTL_DAYS: String(SESSION_TTL_DAYS),
    ...overrides,
  });

  return { app: createApp({ env, logger: createLogger(env.LOG_LEVEL) }), env };
}

function createUser(email: string, deactivatedAt: Date | null = null) {
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: email.split('@')[0] ?? email,
      deactivatedAt,
    },
  });
}

interface UserBody {
  data: {
    user: { id: string; email: string; displayName: string; createdAt: string };
  };
}

interface ErrorBody {
  error: { code: string; message: string };
}

interface Headers {
  headers: Record<string, string | string[] | undefined>;
}

/**
 * Supertest types `set-cookie` as a string even though Node delivers an array,
 * so this helper normalises both shapes in one place.
 */
function setCookieHeaders(response: Headers): string[] {
  const raw = response.headers['set-cookie'];

  if (raw === undefined) {
    throw new Error('Expected a Set-Cookie header, but the response had none.');
  }

  return Array.isArray(raw) ? raw : [raw];
}

function sessionCookie(response: Headers, cookieName: string): string {
  const header = setCookieHeaders(response).find((value) => value.startsWith(`${cookieName}=`));

  if (!header) {
    throw new Error(`Expected a ${cookieName} cookie, but it was not set.`);
  }

  return header;
}

/** The token part of a `name=value; Path=/; ...` header. */
function cookieValue(header: string): string {
  return header.split(';')[0]?.split('=')[1] ?? '';
}

beforeAll(async () => {
  // One hash for the whole file: argon2 is deliberately slow, and hashing the
  // same password fifteen times would only slow the suite down.
  passwordHash = await hashPassword(PASSWORD);
});

beforeEach(resetDatabase);

afterAll(async () => {
  await prisma.$disconnect();
  await disconnectPrismaClient();
});

describe('POST /api/auth/login', () => {
  it('stores only a hash of the session token and returns the public user', async () => {
    const user = await createUser('alice@worknest.test');
    const { app, env } = buildApp();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: PASSWORD });

    expect(response.status).toBe(200);

    const body = response.body as UserBody;
    expect(body.data.user.email).toBe(user.email);
    expect(Object.keys(body.data.user)).not.toContain('passwordHash');

    const header = sessionCookie(response, env.SESSION_COOKIE_NAME);
    const token = cookieValue(header);

    expect(token).not.toBe('');

    const sessions = await prisma.session.findMany();

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.userId).toBe(user.id);
    // The database must never hold the credential itself.
    expect(sessions[0]?.tokenHash).not.toBe(token);
    expect(sessions[0]?.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(sessions[0]?.tokenHash).toBe(hashSessionToken(token));
  });

  it('gives unknown email, wrong password and deactivated accounts the same 401', async () => {
    await createUser('active@worknest.test');
    await createUser('disabled@worknest.test', new Date());
    const { app } = buildApp();

    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@worknest.test', password: PASSWORD });

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'active@worknest.test', password: 'not-the-password' });

    const deactivated = await request(app)
      .post('/api/auth/login')
      .send({ email: 'disabled@worknest.test', password: PASSWORD });

    expect(unknown.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(deactivated.status).toBe(401);

    const bodies = [unknown, wrongPassword, deactivated].map(
      (response) => response.body as ErrorBody,
    );

    for (const body of bodies) {
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    }

    // Identical code *and* message: any difference is a hint to an attacker.
    expect(bodies[0]?.error.message).toBe(bodies[1]?.error.message);
    expect(bodies[1]?.error.message).toBe(bodies[2]?.error.message);

    // None of the attempts may create a session.
    expect(await prisma.session.count()).toBe(0);
  });

  it('normalises the email before looking the account up', async () => {
    await createUser('mixed@worknest.test');
    const { app } = buildApp();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: '  MiXeD@WorkNest.Test  ', password: PASSWORD });

    expect(response.status).toBe(200);
    expect((response.body as UserBody).data.user.email).toBe('mixed@worknest.test');
  });

  it('rejects a body that is not a valid login with 400', async () => {
    const { app } = buildApp();

    const response = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect((response.body as ErrorBody).error.code).toBe('INVALID_REQUEST');
    expect(await prisma.session.count()).toBe(0);
  });

  it('sets a hardened cookie with an absolute lifetime', async () => {
    await createUser('cookie@worknest.test');
    const { app, env } = buildApp();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cookie@worknest.test', password: PASSWORD });

    const header = sessionCookie(response, env.SESSION_COOKIE_NAME);

    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Lax');
    expect(header).toContain('Path=/');
    expect(header).toContain(`Max-Age=${SESSION_TTL_DAYS * 86_400}`);
    // A Secure cookie over plain HTTP is silently dropped by browsers, so it is
    // only set in production.
    expect(header).not.toContain('Secure');
  });

  it('marks the cookie Secure in production', async () => {
    await createUser('secure@worknest.test');
    const { app, env } = buildApp({ NODE_ENV: 'production' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'secure@worknest.test', password: PASSWORD });

    expect(sessionCookie(response, env.SESSION_COOKIE_NAME)).toContain('Secure');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the signed-in user when the cookie is valid', async () => {
    const user = await createUser('me@worknest.test');
    const { app } = buildApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ email: user.email, password: PASSWORD });
    const response = await agent.get('/api/auth/me');

    expect(response.status).toBe(200);
    expect((response.body as UserBody).data.user).toMatchObject({
      id: user.id,
      email: user.email,
    });
  });

  it('returns 401 without a cookie', async () => {
    const { app } = buildApp();

    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect((response.body as ErrorBody).error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 for an expired session even though the cookie is valid', async () => {
    await createUser('expired@worknest.test');
    const { app } = buildApp();
    const agent = request.agent(app);

    await agent
      .post('/api/auth/login')
      .send({ email: 'expired@worknest.test', password: PASSWORD });

    await prisma.session.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const response = await agent.get('/api/auth/me');

    expect(response.status).toBe(401);
    expect((response.body as ErrorBody).error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 when the account is deactivated after signing in', async () => {
    const user = await createUser('later-disabled@worknest.test');
    const { app } = buildApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ email: user.email, password: PASSWORD });
    await prisma.user.update({
      where: { id: user.id },
      data: { deactivatedAt: new Date() },
    });

    const response = await agent.get('/api/auth/me');

    expect(response.status).toBe(401);
    expect((response.body as ErrorBody).error.code).toBe('UNAUTHENTICATED');
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes the session and stays successful when called again', async () => {
    await createUser('bye@worknest.test');
    const { app } = buildApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ email: 'bye@worknest.test', password: PASSWORD });
    expect(await prisma.session.count()).toBe(1);

    const first = await agent.post('/api/auth/logout');

    expect(first.status).toBe(204);
    expect(await prisma.session.count()).toBe(0);

    // Signing out is deliberately public and idempotent: a client holding a dead
    // cookie must still be able to clear it.
    const second = await agent.post('/api/auth/logout');

    expect(second.status).toBe(204);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});

describe('sign-in rate limiting', () => {
  it('blocks the sixth attempt for the same account', async () => {
    await createUser('limited@worknest.test');
    const { app } = buildApp();

    const statuses: number[] = [];

    // The per-account limit is five; the sixth request is refused.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'limited@worknest.test', password: 'wrong-password' });

      statuses.push(response.status);
    }

    expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(statuses[5]).toBe(429);
  });
});

describe('session expiry', () => {
  it('expires after the configured absolute lifetime', async () => {
    await createUser('ttl@worknest.test');
    const { app } = buildApp();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ email: 'ttl@worknest.test', password: PASSWORD });

    const session = await prisma.session.findFirstOrThrow();
    const lifetime = session.expiresAt.getTime() - session.createdAt.getTime();

    expect(lifetime).toBeGreaterThanOrEqual(SESSION_TTL_DAYS * MILLISECONDS_PER_DAY - 1000);
    expect(lifetime).toBeLessThanOrEqual(SESSION_TTL_DAYS * MILLISECONDS_PER_DAY + 1000);
  });
});
