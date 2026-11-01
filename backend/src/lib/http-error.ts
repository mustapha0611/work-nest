/**
 * An error that is safe to translate directly into an HTTP response.
 *
 * Business code throws these; the error middleware renders them into the
 * documented `{ error: { code, message } }` shape. Anything else becomes a
 * generic 500 so internal details never leak to clients.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
