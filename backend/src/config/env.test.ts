import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('applies development defaults when nothing is configured', () => {
    const env = loadEnv({});

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.APP_ORIGIN).toBe('http://localhost:4200');
  });

  it('coerces the port into a number', () => {
    expect(loadEnv({ PORT: '8080' }).PORT).toBe(8080);
  });

  it('rejects a non-numeric port', () => {
    expect(() => loadEnv({ PORT: 'not-a-port' })).toThrow(/PORT/);
  });

  it('rejects a port outside the valid range', () => {
    expect(() => loadEnv({ PORT: '70000' })).toThrow(/PORT/);
  });

  it('rejects an unsupported NODE_ENV', () => {
    expect(() => loadEnv({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('rejects an invalid application origin', () => {
    expect(() => loadEnv({ APP_ORIGIN: 'not a url' })).toThrow(/APP_ORIGIN/);
  });

  it('defaults the database URL to the local Docker database', () => {
    expect(loadEnv({}).DATABASE_URL).toBe(
      'postgresql://worknest:worknest_dev_only@localhost:5432/worknest?schema=public',
    );
  });

  it('rejects a database URL that is not a URL', () => {
    expect(() => loadEnv({ DATABASE_URL: 'worknest' })).toThrow(/DATABASE_URL/);
  });
});
