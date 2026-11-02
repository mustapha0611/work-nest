import type { CookieOptions, Request } from 'express';
import type { Env } from '../../config/env.js';

const MILLISECONDS_PER_DAY = 86_400_000;

/**
 * Attributes shared by setting and clearing the session cookie.
 *
 * `Secure` is off in development on purpose: a browser drops a Secure cookie
 * set over `http://localhost`, so login would appear to succeed and then fail
 * on the next request.
 *
 * `SameSite=Lax` is what makes a separate CSRF token unnecessary here. This API
 * is served from the same origin as the app (dev proxy today, one origin in
 * production), and Lax blocks the cross-site POSTs CSRF relies on. If the API
 * is ever served cross-origin, that assumption dies and a CSRF token has to be
 * added before the change ships.
 */
export function sessionCookieOptions(env: Env): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
  };
}

/** Cookie lifetime in milliseconds. Kept at or above the server-side TTL. */
export function sessionCookieMaxAge(env: Env): number {
  return env.SESSION_TTL_DAYS * MILLISECONDS_PER_DAY;
}

/**
 * Reads the session token from a parsed cookie header.
 *
 * `cookie-parser` types the cookie map as `any`, so the value is narrowed here
 * once instead of being trusted at every call site.
 */
export function readSessionToken(req: Request, cookieName: string): string | undefined {
  const cookies: unknown = req.cookies;

  if (typeof cookies !== 'object' || cookies === null) {
    return undefined;
  }

  const value = (cookies as Record<string, unknown>)[cookieName];

  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
