export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export type LogMeta = Record<string, unknown>;

export interface Logger {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
}

type LogSink = Pick<Console, 'debug' | 'info' | 'warn' | 'error'>;

const SEVERITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/**
 * Minimal structured logger.
 *
 * It writes one JSON object per line so log output stays machine-readable without
 * adding a logging dependency this early. Replace it with a dedicated logger
 * (for example pino) once log shipping or sampling is required.
 */
export function createLogger(level: LogLevel, sink: LogSink = console): Logger {
  const threshold = SEVERITY[level];

  const write = (entryLevel: LogLevel, message: string, meta?: LogMeta): void => {
    if (SEVERITY[entryLevel] < threshold) {
      return;
    }

    const line = JSON.stringify({
      level: entryLevel,
      time: new Date().toISOString(),
      message,
      ...meta,
    });

    sink[entryLevel](line);
  };

  return {
    debug: (message, meta) => write('debug', message, meta),
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
  };
}
