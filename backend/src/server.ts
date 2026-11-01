import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createLogger } from './lib/logger.js';
import { disconnectPrismaClient } from './lib/prisma.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

function start(): void {
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL);
  const app = createApp({ env, logger });

  const server = app.listen(env.PORT, () => {
    logger.info('WorkNest API listening', {
      port: env.PORT,
      environment: env.NODE_ENV,
    });
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error('Port is already in use', { port: env.PORT });
    } else {
      logger.error('HTTP server error', { error: error.message });
    }

    process.exitCode = 1;
  });

  let isShuttingDown = false;

  const shutdown = (signal: NodeJS.Signals): void => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    logger.info('Shutting down', { signal });

    // Stop accepting new connections, then let in-flight requests finish.
    server.close((error) => {
      if (error) {
        logger.error('Failed to close HTTP server cleanly', { error: error.message });
        process.exit(1);
      }

      // Release the database pool before exiting, so PostgreSQL is not left
      // holding connections from a process that no longer exists.
      void disconnectPrismaClient()
        .catch((disconnectError: unknown) => {
          logger.error('Failed to close the database connection', {
            error:
              disconnectError instanceof Error ? disconnectError.message : String(disconnectError),
          });
        })
        .finally(() => process.exit(0));
    });

    // Do not hang forever if a request never completes.
    setTimeout(() => {
      logger.error('Forced shutdown after timeout', { timeoutMs: SHUTDOWN_TIMEOUT_MS });
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

try {
  start();
} catch (error) {
  // Startup failures (including invalid environment configuration) must be
  // visible in the process log and must not leave a half-started server.
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
