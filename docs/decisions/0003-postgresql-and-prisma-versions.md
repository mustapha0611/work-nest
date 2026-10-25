# ADR 0003: PostgreSQL and Prisma versions

- Status: Accepted
- Date: 2026-10-25

## Context

WorkNest needs a relational database for users, sessions, workspaces, memberships, projects, and tasks. No PostgreSQL server was installed locally. Docker Desktop is available, and the current stable PostgreSQL release is 18.6; PostgreSQL 19 is still a release candidate.

Prisma's npm `latest` tag currently points to an 8.0 release candidate, while the current stable client is 7.10.1. Installing without an explicit version could accidentally introduce an unstable major release.

## Decision

- Run PostgreSQL 18.6 in Docker Compose for local development.
- Create two databases: `worknest` for development and `worknest_test` for automated integration tests.
- Pin `prisma`, `@prisma/client`, and `@prisma/adapter-pg` to exactly `7.10.1`.
- Use Prisma's `prisma-client` generator with generated output under `backend/src/generated/prisma`, which is gitignored.
- Configure the datasource and seed command in `backend/prisma.config.ts`.
- Use the `@prisma/adapter-pg` driver adapter and `pg` connection pooling.
- Use Prisma Migrate for schema evolution; tests run `prisma migrate deploy` against the test database.

## Alternatives considered

- **Native PostgreSQL installation:** viable fallback if Docker cannot run, but less reproducible across machines and easier to confuse with an existing local server.
- **PostgreSQL 19:** not stable yet; not appropriate for the project baseline.
- **Prisma 6:** mature, but an older major with a different client setup.
- **Prisma 8 RC:** unstable and explicitly excluded.

## Consequences

- Docker Desktop must be running before database work.
- Prisma 7 requires explicit client generation; `migrate dev` no longer runs it automatically.
- Prisma 7 does not load `.env` automatically; backend configuration must load environment variables explicitly.
- Connection pool settings come from the `pg` driver rather than Prisma 6 defaults, so timeouts must be configured deliberately.
- Local development credentials are disposable and must never be reused in production.
- The test database must never point at the development database. Test setup will assert that the database name ends in `_test`.
