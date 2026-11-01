import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes.js';

/**
 * Everything mounted here is served under `/api`.
 * Add new domain routers alongside `healthRouter` as features arrive.
 */
export const apiRouter: Router = Router();

apiRouter.use('/health', healthRouter);
