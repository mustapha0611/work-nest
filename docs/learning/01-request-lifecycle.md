# 01 — Request lifecycle

## Why this matters

On the client you mostly control rendering: state changes, Angular updates the view. On the server
nothing happens on its own. A function runs **only** when a request arrives, and the client receives
**only** what you explicitly send. The most common backend bug is a code path that never responds,
which leaves the request hanging until a timeout.

## Frontend to backend concept map

| Frontend idea              | Backend equivalent                          | Important difference                             |
| -------------------------- | ------------------------------------------- | ------------------------------------------------ |
| Dev server (`ng serve`)    | `server.ts` + `listen()`                    | A server is a long-running process, not a task   |
| Component tree             | Middleware chain                            | Order is execution order, not a render hierarchy |
| `@if` in a template        | `if` in a controller                        | Same idea, different lifecycle                   |
| Signals                    | No direct equivalent                        | State is per-request; avoid module-level globals |
| `HttpClient`               | `fetch`/`supertest` (client side of a test) | The server receives the request                  |
| `environment.ts`           | `.env` + validated config                   | Must be validated at runtime, not compiled in    |
| Zone.js / change detection | Event loop                                  | Nothing re-renders; responses are written by you |
| `catchError` per call      | One error middleware                        | Centralised instead of repeated                  |

## The trace

```text
Browser
  |  GET /api/health            (relative URL, same origin)
  v
Angular dev server :4200
  |  proxy.conf.json matches "/api"
  v
Express :3000
  |  helmet()            -> security headers
  |  cors()              -> decides whether to advertise an origin
  |  express.json()      -> parses a body if one is present
  |  app.use('/api', apiRouter)
  |      -> apiRouter.use('/health', healthRouter)
  |              -> healthRouter.get('/', getHealth)
  v
getHealth()  ->  res.status(200).json({ data: { ... } })
  v
(no route matched)   -> notFoundHandler  -> 404
(a handler throws)   -> error handler    -> 4xx / 5xx
  v
Angular HealthService maps { data } -> ApiHealth
  v
App.state signal updates -> zoneless change detection re-renders
```

Everything else in the backend is detail hanging off that trace.

## Express: one function signature

Every middleware and handler is:

```ts
(req, res, next) => { ... }
```

- `req` — method, URL, headers, parsed body.
- `res` — the response being built.
- `next` — hand control to the next layer, optionally with an error.

A middleware does exactly one of two things:

1. **Terminates** the request (`res.json(...)`).
2. **Passes control** (`next()` or `next(err)`).

Doing neither hangs the request. Doing both throws `ERR_HTTP_HEADERS_SENT`.

## Order is behaviour

```ts
app.use(helmet());
app.use(cors(...));
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(createErrorHandler(logger));
```

- Move `notFoundHandler` above `apiRouter` and every request 404s.
- Move the error handler above the routes and it never sees their errors.
- Move `express.json()` after the routes and `req.body` is `undefined` inside controllers.

Express walks the stack in registration order. There is no tree, no bubbling, no priority — unlike
the DOM.

## Why the error handler has four parameters

```ts
return (error, req, res, _next) => { ... };
```

Express decides a function is error middleware by checking its arity: **four parameters**. `_next` is
never called, but deleting it silently converts the function into ordinary middleware, and every
thrown error falls through to Express's default HTML error page.

## Express 5 and async handlers

Express 4 did not catch rejected promises:

```ts
app.get('/x', async () => {
  throw new Error('lost'); // Express 4: hang or crash
});
```

Express 5 forwards rejections to the error middleware automatically. That is why controllers can be
`async` without a wrapper library such as `express-async-handler`.

## Two small lines that are not cosmetic

```ts
app.disable('x-powered-by');
```

Removes the `X-Powered-By: Express` fingerprint. Cheap, so we do it.

```ts
app.use(express.json({ limit: '100kb' }));
```

Without a limit, a client can post an enormous body and consume memory before your code runs. The
limit is a denial-of-service guard at the boundary, not a business rule.

Both `json` and `urlencoded` are registered because HTML forms post
`application/x-www-form-urlencoded`, while Angular posts JSON. `extended: false` rejects the legacy
nested-object syntax.

## Where the route lives

`src/routes/index.ts` is the single mount point:

```ts
export const apiRouter = Router();
apiRouter.use('/health', healthRouter);
```

The `/api` prefix exists in exactly one place (`app.ts`), so future modules (`projects`, `tasks`,
`auth`) cannot drift.

## Related

- Error classification: [02-backend-runtime.md](02-backend-runtime.md)
- CORS and origins: [03-security-basics.md](03-security-basics.md)
