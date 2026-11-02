import type { RequestHandler } from 'express';
import type { Env } from '../../config/env.js';
import { HttpError } from '../../lib/http-error.js';
import { loginSchema } from './auth.schemas.js';
import { authenticateUser } from './auth.service.js';
import { readSessionToken, sessionCookieMaxAge, sessionCookieOptions } from './session-cookie.js';
import { createSession, revokeSession } from './session.service.js';

export interface AuthController {
  login: RequestHandler;
  logout: RequestHandler;
  me: RequestHandler;
}

export function createAuthController(env: Env): AuthController {
  const login: RequestHandler = async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new HttpError(
        400,
        'INVALID_REQUEST',
        'The request body is invalid.',
        parsed.error.issues,
      );
    }

    const user = await authenticateUser(parsed.data.email, parsed.data.password);
    const { token } = await createSession(user.id, env.SESSION_TTL_DAYS);

    // Only the cookie carries the token. The response body never does, so the
    // credential cannot end up in a log, a screenshot, or client-side storage.
    res.cookie(env.SESSION_COOKIE_NAME, token, {
      ...sessionCookieOptions(env),
      maxAge: sessionCookieMaxAge(env),
    });

    res.status(200).json({ data: { user } });
  };

  /**
   * Deliberately not behind `requireAuth`. Signing out must never be refused:
   * with an expired session, a protected logout would return 401 and leave the
   * client stuck holding a dead cookie until it expired on its own.
   */
  const logout: RequestHandler = async (req, res) => {
    const token = readSessionToken(req, env.SESSION_COOKIE_NAME);

    if (token) {
      await revokeSession(token);
    }

    res.clearCookie(env.SESSION_COOKIE_NAME, sessionCookieOptions(env));
    res.status(204).end();
  };

  /**
   * What the client calls on startup to answer "am I still signed in?" — it
   * cannot read the session cookie itself.
   */
  const me: RequestHandler = (req, res) => {
    if (!req.user) {
      throw new HttpError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
    }

    res.status(200).json({ data: { user: req.user } });
  };

  return { login, logout, me };
}
