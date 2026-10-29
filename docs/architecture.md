# WorkNest Architecture

## Current status

M1 skeleton implemented: an Angular application and an Express API that communicate through the
dev-server proxy. No authentication, database schema, or product features exist yet.

## Boundaries

- `frontend/`: Angular application, UI behavior, and client-side state.
- `backend/`: Express API, validation, business rules, and persistence integration.
- PostgreSQL: relational data (provisioned, not yet used by application code).
- Prisma: schema, migrations, and typed database access (introduced in M3).

## Backend structure

```text
backend/src/
  app.ts                 createApp() builds the Express app; no port binding
  server.ts              Loads config, listens, handles signals and shutdown
  config/env.ts          Zod-validated environment contract
  lib/                   Logger, HttpError
  middleware/            Central error handler, 404 fallback
  modules/<domain>/      Route + controller (and services/data access when needed)
  routes/index.ts        Mounts module routers under /api
```

Rules:

- `app.ts` and `server.ts` stay separate so tests can drive the real middleware stack through
  Supertest without opening a socket.
- Routes map HTTP paths to controllers; controllers handle HTTP concerns; business rules belong in
  services. Add repositories only when a query layer earns its keep.
- Validate untrusted input at the boundary. Errors leave the process only as
  `{ error: { code, message } }`; unexpected errors become a generic `500`.
- Dependencies are injected into `createApp()` rather than read from module-level singletons, so
  tests can supply their own configuration.
- Security headers come from `helmet`; CORS allows only `APP_ORIGIN`, with credentials enabled for
  the future session cookie.

## Frontend structure

```text
frontend/src/
  app/app.ts             Root component (shell)
  app/app.config.ts      Application providers
  app/app.routes.ts      Route table (empty in M1)
  app/core/              App-wide services; HTTP access lives here
  styles.css             Global styles (design tokens arrive in M2)
```

Rules:

- Feature-first organization as features appear; `core/` for app-wide concerns, `shared/ui/` for
  reusable primitives.
- Components never call `HttpClient` directly. A service owns the endpoint, the response envelope,
  and the mapping to a domain model.
- Signal state is kept small and explicit; templates project it with `@if`/`@else if`.
- `/api` requests stay relative, so development relies on the proxy and production on serving both
  behind one origin.

## Decisions recorded

- npm workspaces: [ADR 0001](decisions/0001-monorepo-and-npm-workspaces.md)
- Runtime and TypeScript versions: [ADR 0002](decisions/0002-runtime-and-typescript-versions.md)
- PostgreSQL and Prisma versions: [ADR 0003](decisions/0003-postgresql-and-prisma-versions.md)

## Decisions still open

- Angular styling and component strategy beyond plain CSS tokens.
- Authentication and session strategy.
- Deployment target and environment strategy.
