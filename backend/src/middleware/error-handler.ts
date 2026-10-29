import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../lib/http-error.js';
import type { Logger } from '../lib/logger.js';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Fallback for requests that matched no route.
 *
 * The path is echoed because it is the client's own input, not internal state.
 */
export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ApiErrorBody = {
    error: {
      code: 'NOT_FOUND',
      message: `No route matches ${req.method} ${req.originalUrl}.`,
    },
  };

  res.status(404).json(body);
};

interface BodyParserError {
  status?: number;
}

function isBodyParserError(error: unknown): error is BodyParserError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (error, req, res, _next) => {
    if (error instanceof HttpError) {
      const body: ApiErrorBody = {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details === undefined ? {} : { details: error.details }),
        },
      };

      res.status(error.status).json(body);
      return;
    }

    // express.json() rejects malformed bodies by throwing an error with status 400.
    if (isBodyParserError(error) && error.status === 400) {
      const body: ApiErrorBody = {
        error: {
          code: 'INVALID_REQUEST',
          message: 'The request body could not be parsed.',
        },
      };

      res.status(400).json(body);
      return;
    }

    logger.error('Unhandled request error', {
      method: req.method,
      path: req.originalUrl,
      error: error instanceof Error ? error.message : String(error),
    });

    const body: ApiErrorBody = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      },
    };

    res.status(500).json(body);
  };
}
