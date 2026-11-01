import { z } from 'zod';
import { LOG_LEVELS } from '../lib/logger.js';

/**
 * Environment contract for the API process.
 *
 * Every variable has a development-safe default so the API can start directly
 * after a clone. Production deployments are expected to set these explicitly;
 * adding a `.env` file is a convenience, not a requirement of the code.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  APP_ORIGIN: z.url().default('http://localhost:4200'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parses and validates environment variables.
 *
 * The process environment is passed in rather than read directly so tests can
 * describe invalid configurations without mutating global state.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'environment';
      return `  - ${path}: ${issue.message}`;
    });

    throw new Error(`Invalid environment configuration:\n${details.join('\n')}`);
  }

  return result.data;
}
