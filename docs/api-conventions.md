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

Implemented codes: `NOT_FOUND`, `INVALID_REQUEST`, `INTERNAL_ERROR`.

## Implemented endpoints

### `GET /api/health`

Liveness probe. It touches no dependencies, so a failure means the process itself is unhealthy
rather than a downstream service being down.

- **200** — `{ data: { status, uptimeSeconds, timestamp } }`
- No authentication required.

## Rules for new endpoints

- Use nouns for resource paths and HTTP methods for operations.
- Validate body, route parameters, and query parameters at the boundary.
- Return appropriate status codes; do not leak internal persistence details.
- Enforce authentication and authorization on the server for protected resources.
- Paginate lists that may grow, with a stable sort order and documented parameters.
- Test success, validation failure, not-found, unauthenticated, and forbidden cases.
- Document stable endpoints with OpenAPI once the API shape settles.
