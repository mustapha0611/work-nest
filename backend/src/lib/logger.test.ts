import { describe, expect, it, vi } from 'vitest';
import { createLogger } from './logger.js';

function createSink() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

describe('createLogger', () => {
  it('drops entries below the configured level', () => {
    const sink = createSink();
    const logger = createLogger('warn', sink);

    logger.debug('ignored');
    logger.info('ignored');
    logger.warn('kept');

    expect(sink.debug).not.toHaveBeenCalled();
    expect(sink.info).not.toHaveBeenCalled();
    expect(sink.warn).toHaveBeenCalledTimes(1);
  });

  it('writes one JSON line including structured metadata', () => {
    const sink = createSink();
    const logger = createLogger('debug', sink);

    logger.error('request failed', { requestId: 'abc-123' });

    const line = (sink.error.mock.calls[0]?.[0] ?? '') as string;
    const entry = JSON.parse(line) as Record<string, unknown>;

    expect(entry).toMatchObject({
      level: 'error',
      message: 'request failed',
      requestId: 'abc-123',
    });
    expect(typeof entry.time).toBe('string');
  });
});
