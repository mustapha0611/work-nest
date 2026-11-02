import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { createLoginRateLimiters } from '../../middleware/rate-limit.js';
import { createRequireAuth } from '../../middleware/require-auth.js';
import { createAuthController } from './auth.controller.js';

export function createAuthRouter(env: Env): Router {
  const router = Router();
  const controller = createAuthController(env);
  const requireAuth = createRequireAuth(env);

  router.post('/login', ...createLoginRateLimiters(), controller.login);

  // Public and idempotent: see the note in the controller.
  router.post('/logout', controller.logout);

  router.get('/me', requireAuth, controller.me);

  return router;
}
