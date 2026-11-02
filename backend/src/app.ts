import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Env } from './config/env.js';
import type { Logger } from './lib/logger.js';
import { createErrorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createApiRouter } from './routes/index.js';

export interface AppDependencies {
  env: Env;
  logger: Logger;
}

/**
 * Builds the Express application without binding a port.
 *
 * Keeping creation separate from listening lets tests drive the real middleware
 * stack through Supertest, with no open sockets and nothing to tear down.
 */
export function createApp({ env, logger }: AppDependencies): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());

  // A string `origin` makes the cors package advertise that origin on every
  // response, even to callers that did not send it. Comparing explicitly keeps
  // the allowlist honest and makes adding a second trusted origin obvious.
  app.use(
    cors({
      origin: (origin, callback) => {
        // Browsers omit Origin for same-origin or non-browser requests.
        const isAllowed = origin === undefined || origin === env.APP_ORIGIN;
        callback(null, isAllowed);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  // Sessions travel in a cookie. Parsing is the only thing this adds: none of
  // the cookie values are trusted until `requireAuth` has looked them up.
  app.use(cookieParser());

  app.use('/api', createApiRouter(env));

  // Order matters: unmatched routes first, then the central error handler.
  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  return app;
}
