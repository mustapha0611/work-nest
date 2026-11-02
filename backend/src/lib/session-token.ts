import { createHash, randomBytes } from 'node:crypto';

/**
 * Session tokens are a credential, not an identifier.
 *
 * Identifiers are optimised to be findable; credentials must be optimised to be
 * unpredictable, and those are opposite goals. A UUID v7 would stamp the
 * creation time into the token and leave the random portion to the generator's
 * discretion. `randomBytes` has exactly one job.
 */
const TOKEN_BYTES = 32;

/** 32 bytes of CSPRNG output, encoded as 43 URL-safe characters. */
export function generateSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

/**
 * Hashes a token for storage.
 *
 * SHA-256, not argon2: the token is 256 bits of uniform randomness, so there is
 * no dictionary to defend against. The slow hashing that protects passwords
 * would add ~150ms to *every authenticated request* for no benefit.
 *
 * Hex rather than base64url so the value is easy to compare by eye in a query.
 */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
