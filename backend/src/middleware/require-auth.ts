import type { RequestHandler } from 'express';
import type { Env } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';
import { readSessionToken } from '../modules/auth/session-cookie.js';
import { findSessionUser } from '../modules/auth/session.service.js';

/**
 * Rejects any request that does not carry a live session.
 *
 * This is the single chokepoint every protected route passes through, which is
 * what makes it the right home for the account-state check: a rule enforced
 * here cannot be forgotten by the next feature that adds an endpoint.
 *
 * It answers "who are you". It never decides "may you do this" — that is
 * authorisation, it belongs to the resource being touched, and it fails with
 * 403 rather than 401.
 *
 * Built as a factory because the cookie name comes from configuration, and the
 * project injects configuration rather than reading module-level singletons.
 */
export function createRequireAuth(env: Env): RequestHandler {
  return async (req, _res, next) => {
    const token = readSessionToken(req, env.SESSION_COOKIE_NAME);

    if (!token) {
      next(new HttpError(401, 'UNAUTHENTICATED', 'Sign in to continue.'));
      return;
    }

    // Express 5 forwards a rejected promise to the error handler, so a database
    // failure here becomes a 500 instead of a hanging request.
    const user = await findSessionUser(token);

    if (!user) {
      next(new HttpError(401, 'UNAUTHENTICATED', 'Your session is no longer valid.'));
      return;
    }

    req.user = user;
    next();
  };
}
