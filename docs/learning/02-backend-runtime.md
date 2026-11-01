# 02 — Backend runtime, configuration, and errors

## Node is a process with an event loop

A browser tab has a DOM and a renderer. A Node process has a main thread, an event loop, and access
to files, sockets, and environment variables.

`app.listen(3000)` opens a **listening socket** and keeps the process alive. Ctrl+C sends `SIGINT`;
with no handler the process dies immediately and in-flight requests are severed. That is why
`server.ts` is more than one `listen()` call.

## ESM and the surprising `.js` extensions

```ts
import { createApp } from './app.js';
```

The source file is `app.ts`. This is intentional.

- Your frontend build resolves `./app` by trying extensions and rewriting imports.
- Node's ESM resolver requires exact filenames at runtime.
- TypeScript does not rewrite import specifiers when it emits.

So you write the path **as it will exist in `dist/`**. TypeScript maps it back to the `.ts` file while
type-checking.

`"type": "module"` in `backend/package.json` is what makes Node treat `.js` files as ESM. Remove it
and the same code fails with `Cannot use import statement outside a module`.

## One codebase, two TypeScript configurations

| File                  | Used by                         | Purpose                                        |
| --------------------- | ------------------------------- | ---------------------------------------------- |
| `tsconfig.json`       | `tsc --noEmit`, ESLint, the IDE | Type-check everything including tests, no emit |
| `tsconfig.build.json` | `tsc -p tsconfig.build.json`    | Emit only `src/`, excluding `*.test.ts`        |

The build config extends the base and changes three things:

```json
"noEmit": false,
"rootDir": "src",
"outDir": "dist"
```

`npm run typecheck` answers "is the code sound?". `npm run build` answers "what will we deploy?".
Keeping them separate stops test files and test-only dependencies from leaking into `dist/`.

## The compiler flags, one by one

| Flag                                    | What it prevents                                         |
| --------------------------------------- | -------------------------------------------------------- |
| `strict`                                | implicit `any`, unchecked `null`/`undefined`             |
| `noUncheckedIndexedAccess`              | `arr[0]` typed as `T` when it may be `undefined`         |
| `exactOptionalPropertyTypes`            | `{ a?: string }` accepting `{ a: undefined }`            |
| `verbatimModuleSyntax`                  | type-only imports emitted as runtime imports             |
| `isolatedModules`                       | syntax that needs whole-program analysis (tsx, bundlers) |
| `module/moduleResolution: NodeNext`     | bundler-style resolution Node cannot execute             |
| `noUnusedLocals` / `noUnusedParameters` | dead code, forgotten parameters                          |

`verbatimModuleSyntax` is why `app.ts` writes `import type { Env }`. It is not style; it guarantees
the emitted JavaScript matches the source.

`noUnusedParameters` is why unused parameters are prefixed: `_req`, `_next`. The underscore tells the
linter the omission is deliberate.

## Development runner versus production runtime

```json
"dev":   "tsx watch --env-file=.env src/server.ts",
"build": "tsc -p tsconfig.build.json",
"start": "node --env-file=.env dist/server.js"
```

- `tsx` transpiles TypeScript on the fly and restarts on change. `dist/` does not exist in dev.
- `tsc` emits plain JavaScript, and production runs that with plain `node`.
- `--env-file` is a Node 24 feature, which is why there is no `dotenv` dependency.

In dev a stack trace points at `.ts`. In production it points at compiled `.js` plus `.map` files.

## Configuration is a contract

```ts
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  APP_ORIGIN: z.url().default('http://localhost:4200'),
});
```

**Why `z.coerce`** — environment variables are always strings. `PORT=3000` arrives as `"3000"`.
Without coercion, `env.PORT` would be a string; `listen("3000")` happens to work while arithmetic
silently misbehaves.

**Why defaults** — the API starts after a clone with no `.env`, which is good developer experience.
It is also a production risk: a misconfigured deployment could quietly bind port 3000 and trust
`localhost:4200`. Closing this gap is a Next step: refuse to start when `NODE_ENV=production` and a
required value was defaulted.

**Why the source is injected**

```ts
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env;
```

Reading `process.env` inside the function would force tests to mutate global state. Passing it in
makes `loadEnv({ PORT: 'not-a-port' })` a pure, deterministic assertion. This is the same principle
as `createApp({ env, logger })`: **inject dependencies, do not reach for globals.**

**Why it fails fast** — a process that starts with broken configuration is worse than one that
refuses to start. The message lists the failing paths (`PORT`, `APP_ORIGIN`), not just "invalid
input".

## Logging

```ts
const line = JSON.stringify({ level, time, message, ...meta });
sink[entryLevel](line);
```

- **One JSON object per line** is directly ingestible by log platforms later.
- **A level threshold** lets `LOG_LEVEL=warn` silence noise without a code change.
- **An injectable sink** (`sink: LogSink = console`) makes it testable: tests pass `vi.fn()`
  functions and assert on the exact payload.

Use `meta` for context (`{ port, environment }`, later `{ requestId, userId }`). Never log passwords,
session cookies, tokens, or whole user objects: logs are usually the least-protected copy of data.

## Errors: one trusted type, everything else generic

```ts
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
}
```

The rule:

- `HttpError` messages are **written for the client** and safe to return.
- Any other error may contain internals, so it becomes a generic `500` and only the log sees the
  real text.

Later, business code throws `new HttpError(404, 'PROJECT_NOT_FOUND', 'Project not found.')` and never
touches Express.

The error middleware has three branches:

| Condition                          | Response                                      |
| ---------------------------------- | --------------------------------------------- |
| `error instanceof HttpError`       | its own status, code, and message             |
| plain object with `status === 400` | `400 INVALID_REQUEST` (malformed JSON body)   |
| anything else                      | `500 INTERNAL_ERROR`, details only in the log |

The malformed-body branch exists because `express.json()` throws on bad JSON. Without it, a client
typo would look like a server bug.

`...(error.details === undefined ? {} : { details: error.details })` exists because of
`exactOptionalPropertyTypes`: omitting a key is not the same as assigning `undefined`, and the JSON
should stay clean.

## Health: liveness, not readiness

```ts
res.status(200).json({
  data: {
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  },
});
```

There is no `HealthService` and no repository because there is no business rule and no data access.
The skill guidance is explicit: do not add layers mechanically. When this endpoint starts pinging the
database it becomes a **readiness** probe and earns a service (M3).

- **Liveness** — "is this process alive?"
- **Readiness** — "can this instance serve traffic?" A database outage must not cause an
  orchestrator to kill a healthy process.

`Math.floor(process.uptime())` keeps the contract an integer. `toISOString()` is UTC; formatting dates
for humans is the frontend's job.

## Process lifecycle

```ts
const server = app.listen(env.PORT, ...);
```

**`EADDRINUSE`** arrives asynchronously, so it cannot be caught around `listen()`. The handler sets
`process.exitCode = 1`; a non-zero exit code is what CI and process managers read.

```ts
server.close((error) => { ... });
```

`close()` stops accepting new connections and waits for in-flight requests. This is **graceful
shutdown**: a deploy does not cut off a user mid-request.

```ts
setTimeout(() => process.exit(1), 10_000).unref();
```

A safety valve: a request that never finishes must not hang the deploy forever. `.unref()` means the
timer does not keep the process alive by itself — without it, exits would be delayed by 10 seconds
even when nothing is pending.

`SIGINT` is Ctrl+C. `SIGTERM` is "please stop" from Docker, Kubernetes, or a process manager.
Ignoring `SIGTERM` leads to forced kills and dropped requests.

The outer `try/catch` exists so a startup failure — including invalid environment — is loud and
exits non-zero.

## Testing the API

```ts
const response = await request(buildApp()).get('/api/health');
```

Supertest calls the Express app object in-process. No port, no server, no teardown — possible only
because `createApp()` does not call `listen()`.

This is an **integration** test: real middleware, real routing, real JSON serialization, no network,
no database.

| Test                                       | Proves                                      |
| ------------------------------------------ | ------------------------------------------- |
| health returns 200 and an ISO timestamp    | the contract shape, not just "it responds"  |
| unknown route returns 404 `NOT_FOUND`      | fallback ordering is correct                |
| malformed JSON returns 400, not 500        | body-parser errors are classified           |
| helmet header present, `x-powered-by` gone | security defaults survive refactors         |
| allowed origin reflected                   | allowlist works                             |
| unknown origin gets no header              | the CORS bug found during M1 stays fixed    |
| env defaults, coercion, rejection          | configuration is validated, not trusted     |
| logger threshold and JSON shape            | logging behaviour, not console side effects |

`response.body as HealthBody` is an honest cast at an untyped boundary; without it, type-aware lint
rules would flag `any`.

## Related

- Middleware order: [01-request-lifecycle.md](01-request-lifecycle.md)
- Helmet and CORS: [03-security-basics.md](03-security-basics.md)
