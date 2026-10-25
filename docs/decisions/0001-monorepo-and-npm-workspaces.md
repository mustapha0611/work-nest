# ADR 0001: Monorepo with npm workspaces

- Status: Accepted
- Date: 2026-10-25

## Context

WorkNest contains two deployable applications: an Angular frontend and an Express backend. The starter folder had documentation and skills but no package manager, lockfile, or application manifests. We need a layout that keeps both applications easy to run together while remaining simple enough to learn from.

## Decision

Use a single Git repository with `frontend/` and `backend/` as npm workspaces. The root `package.json` is private and owns the only `package-lock.json`. Each workspace declares its own dependencies, scripts, and TypeScript configuration.

The root package currently provides only repository-wide formatting scripts. Build, test, lint, and development scripts will be added as each workspace is scaffolded.

## Alternatives considered

- **pnpm workspaces:** faster installs and stricter dependency isolation, but it is not installed and adds another tool to learn and configure.
- **Separate repositories:** simple per application, but duplicates tooling and makes coordinated contract changes harder.
- **Nx or Turborepo:** useful for larger monorepos, but unnecessary orchestration and configuration for two applications at this stage.

## Consequences

- One `npm install` will manage both applications once the workspaces exist.
- npm may hoist dependencies, so workspace-specific version conflicts must be checked with `npm ls`.
- The root lockfile must be committed; workspace lockfiles must not be created.
- CI will use `npm ci` from the repository root.
- A shared contracts package can be added later if type duplication becomes a real problem. It should not be introduced preemptively.
