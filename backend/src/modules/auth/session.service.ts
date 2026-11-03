import { getPrismaClient } from '../../lib/prisma.js';
import { generateSessionToken, hashSessionToken } from '../../lib/session-token.js';
import { toPublicUser, type PublicUser } from './auth.types.js';

const MILLISECONDS_PER_DAY = 86_400_000;

export interface CreatedSession {
  /** Returned to the client in a cookie and never stored in plaintext. */
  token: string;
  expiresAt: Date;
}

/**
 * Opens a session and returns the only copy of its token.
 *
 * The caller must put it in a cookie immediately; the server keeps just the
 * hash, so a lost token cannot be recovered and a stolen database cannot be
 * replayed.
 */
export async function createSession(userId: string, ttlDays: number): Promise<CreatedSession> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + ttlDays * MILLISECONDS_PER_DAY);

  await getPrismaClient().session.create({
    data: { tokenHash: hashSessionToken(token), userId, expiresAt },
  });

  return { token, expiresAt };
}

/**
 * Resolves a token to the user behind it, or null.
 *
 * Null covers three different situations — unknown token, expired session,
 * deactivated account — because the caller must not be able to tell them apart.
 * The session row is the only clock trusted here; the cookie's own expiry is a
 * hint the client controls.
 */
export async function findSessionUser(token: string): Promise<PublicUser | null> {
  const session = await getPrismaClient().session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  if (session.user.deactivatedAt !== null) {
    return null;
  }

  return toPublicUser(session.user);
}

/**
 * Deletes the session for a token. Never fails on a token that no longer
 * exists: signing out must be idempotent, or a client with a dead cookie can
 * never clear it.
 */
export async function revokeSession(token: string): Promise<void> {
  await getPrismaClient().session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
}
