import { Router } from 'express';
import type { Env } from '../config/env.js';
import { createAuthRouter } from '../modules/auth/auth.routes.js';
import { healthRouter } from '../modules/health/health.routes.js';

/**
 * Everything mounted here is served under `/api`.
 *
 * A factory rather than a module-level router, because the auth router needs
 * configuration (cookie name, session lifetime) and this project injects
 * configuration instead of reading it from module-level singletons.
 */
export function createApiRouter(env: Env): Router {
  const router = Router();

  router.use('/health', healthRouter);
  router.use('/auth', createAuthRouter(env));

  return router;
}
