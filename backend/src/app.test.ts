import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createLogger } from './lib/logger.js';

interface HealthBody {
  data: {
    status: string;
    uptimeSeconds: number;
    timestamp: string;
  };
}

interface ErrorBody {
  error: {
    code: string;
    message: string;
  };
}

function buildApp() {
  const env = loadEnv({
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    APP_ORIGIN: 'http://localhost:4200',
  });

  return createApp({ env, logger: createLogger(env.LOG_LEVEL) });
}

describe('GET /api/health', () => {
  it('returns a successful health payload', async () => {
    const response = await request(buildApp()).get('/api/health');
    const body = response.body as HealthBody;

    expect(response.status).toBe(200);
    expect(body.data.status).toBe('ok');
    expect(typeof body.data.uptimeSeconds).toBe('number');
    expect(Number.isNaN(Date.parse(body.data.timestamp))).toBe(false);
  });
});

describe('unknown routes', () => {
  it('responds with the documented 404 error shape', async () => {
    const response = await request(buildApp()).get('/api/does-not-exist');
    const body = response.body as ErrorBody;

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('/api/does-not-exist');
  });
});

describe('request parsing', () => {
  it('rejects a malformed JSON body with 400 instead of 500', async () => {
    const response = await request(buildApp())
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');
    const body = response.body as ErrorBody;

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('INVALID_REQUEST');
  });
});

describe('security headers', () => {
  it('sets helmet headers and hides the framework signature', async () => {
    const response = await request(buildApp()).get('/api/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});

describe('CORS', () => {
  it('allows the configured frontend origin', async () => {
    const response = await request(buildApp())
      .get('/api/health')
      .set('Origin', 'http://localhost:4200');

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:4200');
  });

  it('does not emit an allow-origin header for an unknown origin', async () => {
    const response = await request(buildApp())
      .get('/api/health')
      .set('Origin', 'http://evil.example');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
