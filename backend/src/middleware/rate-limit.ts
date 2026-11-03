import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { HttpError } from '../lib/http-error.js';

const WINDOW_MS = 15 * 60 * 1000;
/** One account should not accept many guesses, from anywhere. */
const LIMIT_PER_ACCOUNT = 5;
/** One host should not spray many accounts. */
const LIMIT_PER_ADDRESS = 20;

function rateLimited(): HttpError {
  return new HttpError(429, 'RATE_LIMITED', 'Too many sign-in attempts. Try again later.');
}

function emailFromBody(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'email' in body) {
    const { email } = body;
    if (typeof email === 'string') {
      return email.trim().toLowerCase();
    }
  }
  return '';
}

/**
 * Two limits on sign-in, because they stop different attacks.
 *
 * - per address + email: one account cannot be hammered with guesses.
 * - per address: one host cannot try a little against many accounts, which is
 *   how a leaked password list gets sprayed.
 *
 * `ipKeyGenerator` is used rather than `req.ip` directly: it groups IPv6
 * addresses by subnet, so an attacker with a /64 cannot mint billions of
 * "different" addresses for free.
 *
 * Limitation, recorded rather than hidden: the default store is in memory and
 * per process. Two API instances mean two independent counters, so the real
 * limit multiplies with instance count. A shared store (Redis) is the fix, and
 * it is only worth its operational cost once the API runs multi-instance.
 *
 * `req.ip` is only meaningful behind a proxy when Express is told to trust it
 * (`TRUST_PROXY`); otherwise every caller shares the proxy's address and this
 * limiter would lock out the whole internet at once.
 */
export function createLoginRateLimiters(): RequestHandler[] {
  const perAddress = rateLimit({
    windowMs: WINDOW_MS,
    limit: LIMIT_PER_ADDRESS,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),
    handler: (_req: Request, _res: Response, next: NextFunction) => next(rateLimited()),
  });

  const perAccount = rateLimit({
    windowMs: WINDOW_MS,
    limit: LIMIT_PER_ACCOUNT,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? '')}:${emailFromBody(req.body)}`,
    handler: (_req: Request, _res: Response, next: NextFunction) => next(rateLimited()),
  });

  // Cheapest and coarsest first: a host that is spraying hits the address limit
  // before its individual account keys are even created.
  return [perAddress, perAccount];
}
