import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorBody {
  error?: {
    code?: unknown;
  };
}

function apiErrorCode(error: HttpErrorResponse): string | null {
  const body: unknown = error.error;

  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const { error: inner } = body as ApiErrorBody;

  if (typeof inner !== 'object' || inner === null) {
    return null;
  }

  return typeof inner.code === 'string' ? inner.code : null;
}

/**
 * Turns a failed sign-in into one sentence a person can act on.
 *
 * The backend deliberately gives the same `INVALID_CREDENTIALS` response for an
 * unknown email, a wrong password and a deactivated account, so the UI must not
 * invent a more specific explanation than the API is willing to give.
 */
export function describeLoginError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Something went wrong. Try again.';
  }

  if (error.status === 0) {
    return 'Cannot reach the API. Make sure the backend is running and try again.';
  }

  const code = apiErrorCode(error);

  if (error.status === 429 || code === 'RATE_LIMITED') {
    return 'Too many sign-in attempts. Wait a few minutes and try again.';
  }

  if (error.status === 401 || code === 'INVALID_CREDENTIALS') {
    return 'Email or password is incorrect.';
  }

  if (error.status === 400) {
    return 'Check your email address and password.';
  }

  return 'The API could not complete the request. Try again.';
}
