# API Conventions

These rules are enforced by the running API in `backend/`. Update this document when behavior
changes.

## Base path

All endpoints live under `/api`.

## Success responses

Wrap the payload in `data`:

```json
{
  "data": {
    "status": "ok",
    "uptimeSeconds": 12,
    "timestamp": "2026-10-29T13:03:30.720Z"
  }
}
```

List endpoints will add a sibling `meta` object for pagination. Empty results return an empty
array, not a 404.

## Error responses

Every error uses the same shape:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "No route matches GET /api/nope."
  }
}
```

- `code` is a stable, machine-readable identifier.
- `message` is safe to show to a user and never contains stack traces or internal details.
- `details` is optional and appears only when it helps the client correct the request (for example
  validation issues).

Implemented codes: `NOT_FOUND`, `INVALID_REQUEST`, `INTERNAL_ERROR`, `UNAUTHENTICATED`,
`INVALID_CREDENTIALS`, `RATE_LIMITED`.

## Authentication

Sign-in is a cookie session, not a bearer token. `POST /api/auth/login` sets an `HttpOnly` cookie
(`wn_session` by default) and every protected request must carry it. Clients never read or store the
token themselves; a browser attaches the cookie automatically, and a non-browser client has to
preserve it between requests.

- A missing, unknown or expired session is **401** with code `UNAUTHENTICATED`.
- A failed sign-in is **401** with code `INVALID_CREDENTIALS`. The message is identical for an unknown
  email, a wrong password and a deactivated account, so the endpoint cannot be used to discover which
  accounts exist.
- **403** means "authenticated but not allowed" and is reserved for authorization rules on specific
  resources. It is not used for a missing session.
- The cookie is `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production. See
  [ADR 0007](decisions/0007-sessions.md).
- Sign-in is rate limited to 5 attempts per address and email, and 20 per address, per 15-minute
  window. Blocked requests return **429** with code `RATE_LIMITED`.

## Implemented endpoints

### `GET /api/health`

Liveness probe. It touches no dependencies, so a failure means the process itself is unhealthy
rather than a downstream service being down.

- **200** — `{ data: { status, uptimeSeconds, timestamp } }`
- No authentication required.

### `POST /api/auth/login`

Exchanges email and password for a session cookie.

```json
{ "email": "demo@worknest.local", "password": "worknest-demo" }
```

- **200** — `{ data: { user: { id, email, displayName, createdAt } } }` and a `Set-Cookie` header.
  The response body never contains the session token.
- **400** `INVALID_REQUEST` — body fails validation.
- **401** `INVALID_CREDENTIALS` — email, password or account state did not match.
- **429** `RATE_LIMITED` — too many attempts. The limit applies to failures and successes alike.
- Emails are trimmed and lower-cased before lookup, so `Alice@Example.com` and `alice@example.com`
  are the same account.

### `GET /api/auth/me`

Returns the signed-in user. This is how the app answers "am I still signed in?" on startup, because
JavaScript cannot read the session cookie.

- **200** — `{ data: { user: { id, email, displayName, createdAt } } }`
- **401** `UNAUTHENTICATED` — no cookie, unknown token, expired session or deactivated account.

### `POST /api/auth/logout`

Revokes the current session and clears the cookie.

- **204** — no body. The cookie is cleared even when there was no valid session.
- Public and idempotent on purpose: a client whose session already expired must still be able to
  sign out.

## Rules for new endpoints

- Use nouns for resource paths and HTTP methods for operations.
- Validate body, route parameters, and query parameters at the boundary.
- Return appropriate status codes; do not leak internal persistence details.
- Enforce authentication and authorization on the server for protected resources.
- Paginate lists that may grow, with a stable sort order and documented parameters.
- Test success, validation failure, not-found, unauthenticated, and forbidden cases.
- Document stable endpoints with OpenAPI once the API shape settles.
