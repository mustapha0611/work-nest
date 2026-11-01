# 03 — Security basics in the M1 skeleton

M1 has no users, passwords, or cookies yet. What exists now is the frame those features will hang
from, and the two rules that matter: **do not leak internals** and **do not pretend to protect
something you are not protecting**.

## Security headers from Helmet

`app.use(helmet())` sets a set of defaults. The ones visible in the health response:

| Header                                        | Effect                                                     |
| --------------------------------------------- | ---------------------------------------------------------- |
| `X-Content-Type-Options: nosniff`             | the browser must not guess content types (blocks some XSS) |
| `X-Frame-Options: SAMEORIGIN`                 | the page cannot be framed by another site (clickjacking)   |
| `Content-Security-Policy: default-src 'self'` | restricts what a document may load                         |
| `Referrer-Policy: no-referrer`                | no URL leakage to third parties                            |
| `Strict-Transport-Security`                   | forces HTTPS; ignored over plain HTTP, so harmless locally |

Helmet is not a silver bullet. It is a set of sane defaults so nobody has to remember each header.
The CSP matters more when the API serves HTML; `X-Frame-Options`, HSTS, and `SameSite` start doing
real work together when session cookies arrive in M4.

## CORS is a browser rule, not server security

The part frontend developers usually know from the outside and misread from the inside:

- CORS does **not** stop `curl`, Postman, or another backend from calling the API.
- It tells the browser whether JavaScript on origin A may **read** a response from origin B.
- The browser sends `Origin: http://localhost:4200`; the server replies with
  `Access-Control-Allow-Origin` or nothing; the **browser** enforces the decision.

The bug the tests caught:

```ts
cors({ origin: 'http://localhost:4200' }); // sets the header on EVERY response
```

That header appeared even for `Origin: http://evil.example`. The browser would still block the
response, so it was not exploitable — but the configuration claimed an intent it did not implement.
The fix compares explicitly:

```ts
origin: (origin, callback) => {
  const isAllowed = origin === undefined || origin === env.APP_ORIGIN;
  callback(null, isAllowed);
};
```

Passing `false` omits the header. Note `origin === undefined`: same-origin and non-browser requests do
not send an `Origin` header at all.

`credentials: true` is already enabled because M4 adds a session cookie. Consequences to remember:

- With credentials, `Access-Control-Allow-Origin` **cannot** be `*`. That is why the allowed origin is
  reflected rather than wildcarded.
- Cookies need a `SameSite` policy; the plan is `SameSite=Lax` with same-origin deployment.
- CORS is never an authorization mechanism. Authorization is a server-side check on a specific
  resource, and it arrives in M5.

## Why the proxy removes CORS from development

Angular calls `'/api/health'` — a relative URL. The browser resolves it to
`http://localhost:4200/api/health`, the dev server forwards it to `:3000`, and the browser sees a
single origin. No preflight, no allow-origin header needed.

Remove the proxy and you would need all of:

- cross-origin URLs or a base URL per environment,
- `withCredentials` on the client,
- preflight (`OPTIONS`) handling for non-simple requests,
- a server that reflects the exact origin.

More moving parts, more failure modes. Production will serve both behind one origin for the same
reason.

## Errors must not leak internals

The rule from [02-backend-runtime.md](02-backend-runtime.md):

| Error type    | What the client sees            |
| ------------- | ------------------------------- |
| `HttpError`   | the message the developer wrote |
| anything else | `An unexpected error occurred.` |

Stack traces, SQL fragments, file paths, and dependency versions go to the log, never to the
response. A stack trace in a response is a map of your internals for an attacker.

## `x-powered-by` and fingerprinting

`app.disable('x-powered-by')` removes `X-Powered-By: Express`. It is not security by obscurity and it
does not stop a determined attacker; it simply avoids volunteering information.

## What must never be logged

The logger accepts arbitrary metadata, which makes it easy to leak:

- passwords or password hashes,
- session cookies, `Authorization` headers, API tokens,
- full user records or request bodies that may contain the above.

Log identifiers (`userId`, `workspaceId`, `requestId`) and outcomes, not payloads.

The same principle applies to `.env`:

- `.env` is gitignored and local.
- `.env.example` is committed, contains obvious non-secrets (`worknest_dev_only`), and documents the
  variable names.
- Git history is effectively permanent: deleting a secret in a later commit does not remove it.
  Rotating the secret is the only real response to an accidental commit.

## Current gaps (deliberate)

| Gap                                  | Reason                                                    |
| ------------------------------------ | --------------------------------------------------------- |
| No authentication                    | Needs users, hashing, and sessions designed together (M4) |
| No rate limiting                     | Nothing guessable or expensive to protect yet             |
| No CSRF protection                   | No cookie-based auth exists yet                           |
| No request size limits beyond 100 kB | Enough for current JSON endpoints                         |
| No production config guard           | Defaults are convenient now; must be closed before deploy |

## Related

- Error middleware: [02-backend-runtime.md](02-backend-runtime.md)
- Allowed origin configuration: [01-request-lifecycle.md](01-request-lifecycle.md)
