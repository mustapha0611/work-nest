import { HttpErrorResponse } from '@angular/common/http';
import { describeLoginError } from './auth-errors';

function httpError(status: number, body: unknown = null): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: body, statusText: 'Error' });
}

describe('describeLoginError', () => {
  it('explains an unreachable API', () => {
    expect(describeLoginError(httpError(0))).toContain('Cannot reach the API');
  });

  it('uses the generic credentials message for 401', () => {
    const message = describeLoginError(httpError(401, { error: { code: 'INVALID_CREDENTIALS' } }));

    expect(message).toBe('Email or password is incorrect.');
  });

  it('explains rate limiting', () => {
    expect(describeLoginError(httpError(429, { error: { code: 'RATE_LIMITED' } }))).toContain(
      'Too many sign-in attempts',
    );
  });

  it('falls back to a safe message without leaking the response body', () => {
    const message = describeLoginError(httpError(500, { error: { code: 'BOOM' } }));

    expect(message).toBe('The API could not complete the request. Try again.');
    expect(message).not.toContain('BOOM');
  });

  it('handles a non-HTTP error', () => {
    expect(describeLoginError(new Error('boom'))).toBe('Something went wrong. Try again.');
  });
});
