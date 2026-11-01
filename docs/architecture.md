# WorkNest Architecture

## Current status

M3 schema implemented: the database models for users, workspaces, memberships, projects and tasks
exist with one applied migration, and a Prisma client is wired into the backend. No authentication or
product endpoints exist yet, so nothing in the running API reads or writes those tables.

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
  src/lib/               Logger, HttpError, Prisma client
  src/middleware/        Central error handler, 404 fallback
  src/modules/<domain>/  Route + controller (and services/data access when needed)
  src/routes/index.ts    Mounts module routers under /api
  src/test/db/           Integration tests that need a live PostgreSQL
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
- `lib/prisma.ts` exposes `createPrismaClient(url)` plus a lazy process-wide client. Services call
  `getPrismaClient()`; `server.ts` disconnects it during shutdown.

## Data model

| Model        | Purpose                              | Key constraints                                                         |
| ------------ | ------------------------------------ | ----------------------------------------------------------------------- |
| `User`       | Account and author of tasks          | `email` unique                                                          |
| `Workspace`  | Tenant boundary                      | `slug` unique                                                           |
| `Membership` | User's role inside a workspace       | unique `(workspaceId, userId)`, index `(userId)`                        |
| `Project`    | Grouping of tasks inside a workspace | index `(workspaceId, status)`                                           |
| `Task`       | Unit of work inside a project        | indexes `(projectId, status)`, `(projectId, createdAt)`, `(assigneeId)` |

- Primary keys are UUID v7, so ids sort by creation time and cannot be guessed from a URL.
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
npm run test:db -w backend     # migrate worknest_test, then run *.db.test.ts
```

`npm test` never touches a database. The `test:db` suite does, and it is the only check that proves
the schema and the migrations agree with each other.

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

## Decisions still open

- Angular styling and component strategy beyond plain CSS tokens.
- Authentication and session strategy.
- Deployment target and environment strategy.
