# WorkNest Architecture

## Current status

M4 authentication flow implemented across both workspaces. Users sign in with email and password on
the Angular login screen, receive a database-backed session cookie, see a signed-in placeholder
screen, and can sign out. No product endpoints (workspaces, projects, tasks) exist yet, and there is
no registration: users will join through workspace invitations in M5, so the only ways to get an
account today are the development seed and direct database access.

## Authentication boundary

- A session is an opaque 32-byte token in an `HttpOnly` cookie. The database stores only its SHA-256
  hash, so a leaked database or backup cannot be replayed as a live session
  ([ADR 0007](decisions/0007-sessions.md)).
- `requireAuth` is the single gate for protected routes. It resolves the cookie to a user, rejects
  expired sessions, and rejects deactivated accounts. Handlers read `req.user`; they never parse the
  cookie themselves.
- The middleware answers "who are you" (401). Authorization — "may this user touch this resource?" —
  belongs to the feature and answers 403. M4 has no workspace resources yet, so 403 is not exercised.
- Passwords use argon2id. Sessions use SHA-256 for the reason above: high-entropy secrets do not need a
  deliberately slow hash, and adding one to every authenticated request would tax the whole API.
- Login failures are identical for an unknown email, a wrong password and a deactivated account, and
  the unknown-email path spends the same verification time as a real check. The endpoint does not
  reveal which accounts exist.
- Sign-in has two in-memory rate limits: per address + email (5 per 15 minutes) and per address (20 per
  15 minutes). The store is per process; moving to multiple API instances requires a shared store.
- Session lifetime is absolute (7 days by default) with no sliding renewal. The database row is the only
  clock the server trusts.

## Boundaries

- `frontend/`: Angular application, UI behavior, and client-side state.
- `backend/`: Express API, validation, business rules, and persistence integration.
- PostgreSQL: relational data, defined by the Prisma schema and changed only through migrations.
- Prisma: schema, migrations, and typed database access, pinned to 7.10.1 and connected through the
  `@prisma/adapter-pg` driver adapter.

## Backend structure

```text
backend/
  prisma.config.ts       Prisma CLI config: schema path, migrations path, DATABASE_URL
  prisma/schema.prisma   Single source of truth for tables, relations and indexes
  prisma/migrations/     Generated SQL, applied in order and never edited by hand
  src/app.ts             createApp() builds the Express app; no port binding
  src/server.ts          Loads config, listens, handles signals and shutdown
  src/config/env.ts      Zod-validated environment contract
  src/lib/               Logger, HttpError, Prisma client, password hashing, session tokens
  src/middleware/        Error handler, 404 fallback, requireAuth, rate limiters
  src/modules/auth/      Login/logout/me, credential checks, session create/resolve/revoke
  src/modules/<domain>/  Route + controller (and services/data access when needed)
  src/routes/index.ts    createApiRouter(env) mounts module routers under /api
  src/test/db/           Integration tests that need a live PostgreSQL
  prisma/seed.ts         Development-only demo account; refuses to run in production
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
- Security headers come from `helmet`; CORS allows only `APP_ORIGIN`, with credentials enabled so the
  browser sends the session cookie.
- `lib/prisma.ts` exposes `createPrismaClient(url)` plus a lazy process-wide client. Services call
  `getPrismaClient()`; `server.ts` disconnects it during shutdown.
- Environment-dependent behavior (cookie name, session lifetime, secure cookies) arrives through
  `Env`, so the same code is testable without changing global state.

## Data model

| Model        | Purpose                              | Key constraints                                                         |
| ------------ | ------------------------------------ | ----------------------------------------------------------------------- |
| `User`       | Account and author of tasks          | `email` unique; `deactivatedAt` null means active                       |
| `Session`    | One signed-in browser                | `tokenHash` unique; index `(userId)`; cascades from `User`              |
| `Workspace`  | Tenant boundary                      | `slug` unique                                                           |
| `Membership` | User's role inside a workspace       | unique `(workspaceId, userId)`, index `(userId)`                        |
| `Project`    | Grouping of tasks inside a workspace | index `(workspaceId, status)`                                           |
| `Task`       | Unit of work inside a project        | indexes `(projectId, status)`, `(projectId, createdAt)`, `(assigneeId)` |

- Primary keys are UUID v7, so ids sort by creation time and cannot be guessed from a URL. Session
  tokens are separate random values; a primary key is never used as a credential.
- `Session.tokenHash` stores the SHA-256 of the cookie token, never the token itself. A session is
  deleted on sign-out and cascades when its user row is removed.
- `User.deactivatedAt` is checked by `requireAuth` on every request, so deactivation takes effect even
  if a session row still exists.
- Expired session rows are not swept automatically in M4. They are small and ignored by lookups; a
  cleanup job becomes worthwhile once the table grows.
- **Projects are archived, tasks are soft-deleted**; neither has a delete path
  ([ADR 0005](decisions/0005-no-hard-deletes.md)). Every task query must filter `deletedAt: null`.
- Relation deletion behaviour is explicit: workspace cascades to memberships and projects, project
  cascades to tasks, a deleted assignee sets `Task.assigneeId` to null, and a user who created tasks
  cannot be deleted.
- "An assignee must be a member of the workspace" cannot be expressed without copying `workspaceId`
  onto `Task`. It is enforced in the service layer when assignment is implemented, not by the schema.

## Database workflow

```bash
npm run dev:backend            # expects PostgreSQL from docker compose
npm run db:generate -w backend # regenerate the typed client after a schema change
npm run db:migrate -w backend  # create and apply a migration during development
npm run db:deploy -w backend   # apply committed migrations, no schema authoring
npm run db:seed -w backend     # create or refresh demo@worknest.local (development only)
npm run test:db -w backend     # migrate worknest_test, then run *.db.test.ts
```

`npm test` never touches a database. The `test:db` suite does, and it is the only check that proves
the schema and the migrations agree with each other.

## Frontend structure

```text
frontend/src/
  app/app.ts                 Root shell: router outlet only
  app/app.config.ts          Providers, including the session initializer
  app/app.routes.ts          Lazy routes, guarded by auth/guest guards
  app/core/auth/             Session state, HTTP calls, guards, error mapping
  app/core/health/           Health-check HTTP service
  app/features/auth/         Login page
  app/features/home/         Temporary signed-in screen
  app/features/system-status/ API diagnostics page
  app/shared/ui/             Button, badge, text-field primitives
  styles.css                 Global reset and focus behaviour
  styles/tokens.css          Design tokens
```

Rules:

- Feature-first organization; `core/` for app-wide concerns, `shared/ui/` for reusable primitives.
- Components never call `HttpClient` directly. A service owns the endpoint, the response envelope,
  and the mapping to a domain model.
- Signal state is kept small and explicit; templates project it with `@if`/`@else if`.
- `/api` requests stay relative, so development relies on the proxy and production on serving both
  behind one origin.
- `AuthService` holds the one source of truth for the signed-in user. It exposes read-only signals;
  only login, logout and the startup session check may change them.
- `provideAppInitializer` resolves `GET /api/auth/me` before the first navigation, so `authGuard` and
  `guestGuard` can be synchronous. A failed check becomes "anonymous" rather than blocking bootstrap.
- The browser never reads the session token. The cookie is `HttpOnly`; `/me` is how the UI learns who
  the user is.

## Workflow orchestration

How agent work moves from a request to an approved result — roles, flow, phase states, and
permissions — is mapped in [orchestration.md](orchestration.md). The executable source of truth is
`.opencode/skills/orchestration/SKILL.md`.

## Decisions recorded

- npm workspaces: [ADR 0001](decisions/0001-monorepo-and-npm-workspaces.md)
- Runtime and TypeScript versions: [ADR 0002](decisions/0002-runtime-and-typescript-versions.md)
- PostgreSQL and Prisma versions: [ADR 0003](decisions/0003-postgresql-and-prisma-versions.md)
- One branch per concern: [ADR 0004](decisions/0004-branch-per-concern.md)
- Projects and tasks are never hard-deleted: [ADR 0005](decisions/0005-no-hard-deletes.md)
- Accounts are deactivated, not deleted: [ADR 0006](decisions/0006-user-deactivation.md)
- Database-backed opaque session tokens: [ADR 0007](decisions/0007-sessions.md)

## Decisions still open

- Angular styling and component strategy beyond plain CSS tokens.
- CSRF strategy if the API is ever served cross-origin from the app (see ADR 0007).
- Deployment target and environment strategy, including `TRUST_PROXY` and the shared rate-limit store.
