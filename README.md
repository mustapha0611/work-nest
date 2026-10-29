# WorkNest

A learning-first, production-minded team project and task management platform.

The repository currently contains the application skeleton: an Angular frontend, an Express API,
shared tooling, and a local PostgreSQL instance. Product features (authentication, workspaces,
projects, tasks) arrive in later milestones.

## Stack

| Layer       | Choice                                                        |
| ----------- | ------------------------------------------------------------- |
| Frontend    | Angular 22, standalone APIs, signals, zoneless, plain CSS     |
| Backend     | Node.js 24, Express 5, TypeScript 5.9, ESM                    |
| Frontend TS | TypeScript 6.0.3 (required by Angular 22)                     |
| Database    | PostgreSQL 18.6 in Docker, Prisma 7 (from the data milestone) |
| Tests       | Vitest + Supertest (API), Angular unit-test builder (web)     |

Frontend and backend intentionally use different TypeScript versions. See
[ADR 0002](docs/decisions/0002-runtime-and-typescript-versions.md).

## Prerequisites

- Node.js `24.15.0` (see `.nvmrc`) and npm `>=11`
- Docker Desktop, for the local PostgreSQL container

```powershell
nvm use 24.15.0
node --version   # v24.15.0
```

## Setup

```powershell
npm install                 # one install for both workspaces
docker compose up -d --wait # PostgreSQL 18.6 on localhost:5432
```

The database volume creates two databases on first start:

- `worknest` for development
- `worknest_test` for automated tests

The backend reads `backend/.env`, which is not committed. Create it from the documented variables:

```powershell
Copy-Item .env.example backend/.env
```

Every backend variable has a development-safe default, so the API also starts without a `.env`
file. Production deployments must set the values explicitly.

## Commands

Run from the repository root.

| Command                | What it does                                           |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | Runs the API on `:3000` and the Angular app on `:4200` |
| `npm run dev:backend`  | API only                                               |
| `npm run dev:frontend` | Angular app only                                       |
| `npm run build`        | Production builds for both workspaces                  |
| `npm test`             | API tests, then Angular unit tests                     |
| `npm run lint`         | ESLint for both workspaces                             |
| `npm run typecheck`    | TypeScript checks for both workspaces                  |
| `npm run format`       | Prettier across the repository                         |

The Angular dev server proxies `/api` to `http://localhost:3000` (`frontend/proxy.conf.json`), so
the browser only ever talks to one origin during development.

Open `http://localhost:4200` — the landing screen reports whether the API is reachable.

## Project structure

```text
backend/
  src/
    app.ts              Express app factory (no port binding)
    server.ts           Process lifecycle: listen, signals, shutdown
    config/env.ts       Environment validation
    lib/                Small shared helpers (logger, HTTP error)
    middleware/         Error handling and 404 fallback
    modules/health/     Health route and controller
    routes/             Mounts module routers under /api
frontend/
  src/app/core/         App-wide services (API access)
  src/app/              Root component and configuration
  proxy.conf.json       Dev-server proxy to the API
docs/                   Architecture, API conventions, design system, ADRs
```

## Documentation

- [Architecture](docs/architecture.md)
- [API conventions](docs/api-conventions.md)
- [Design system](docs/design-system.md)
- [Decision records](docs/decisions/)

## Roadmap

| Milestone | Scope                                          |
| --------- | ---------------------------------------------- |
| M0        | Repository, tooling, and local database        |
| M1        | Angular + Express skeleton with a health check |
| M2        | Design tokens and shared UI primitives         |
| M3        | Prisma schema and migrations                   |
| M4        | Authentication with database-backed sessions   |
| M5        | Workspaces, membership, and roles              |
| M6        | Projects                                       |
| M7        | Tasks                                          |
