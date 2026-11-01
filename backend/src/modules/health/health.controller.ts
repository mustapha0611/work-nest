import type { RequestHandler } from 'express';

/**
 * Liveness probe. It deliberately touches no dependencies, so a failure means
 * the process itself is unhealthy rather than a downstream service being down.
 */
export const getHealth: RequestHandler = (_req, res) => {
  res.status(200).json({
    data: {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
};
