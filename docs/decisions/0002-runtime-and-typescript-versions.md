# ADR 0002: Runtime and TypeScript versions

- Status: Accepted
- Date: 2026-10-25

## Context

Angular CLI 22.2.4 requires Node `^22.22.3 || ^24.15.0 || >=26.0.0` and Angular 22 requires TypeScript `>=6.0 <6.1`. Prisma ORM 7 supports Node 20.19+ and recommends Node 22.x; its documentation lists TypeScript 5.9.x as the recommended version with a minimum of 5.4.

A single TypeScript version therefore creates a conflict between Angular's required compiler range and Prisma's tested range.

## Decision

- Use Node 24 LTS, at least `24.15.0`, recorded in `.nvmrc` and root `engines`.
- Use TypeScript `6.0.3` in the frontend workspace to satisfy Angular 22.
- Use TypeScript `5.9.3` in the backend workspace to follow Prisma 7's documented recommendation and support the ESM/NodeNext build.
- Do not declare TypeScript at the repository root.
- Document the split in the README and keep both versions visible in the root lockfile.

The backend's TypeScript/Prisma combination will be verified during M3 (the database milestone) with `prisma generate`, `tsc --noEmit`, and a production build. If Prisma 7.10.1 cannot generate or type-check under TypeScript 5.9.3, we will stop and revisit the decision before writing data-backed features. M1 deliberately contains no Prisma schema, so generating a client there would have verified nothing about the real usage.

## Alternatives considered

- **TypeScript 6.0.x everywhere:** one compiler version, but it is outside Prisma's documented recommendation and adds avoidable risk to the backend build.
- **TypeScript 5.9.x everywhere:** compatible with Prisma but does not satisfy Angular 22's peer dependency.
- **Older Angular version:** avoids the split but gives up current framework support and the project's intended stack.

## Consequences

- npm workspaces will install two TypeScript versions in the tree. This is expected, not a defect.
- ESLint configuration must be workspace-specific because the parser and compiler versions differ.
- Raw TypeScript source should not be shared directly between frontend and backend. If shared contracts are needed later, they must be designed with the compiler split in mind, or exposed as generated/plain DTO types.
- Node 24.15.0 must be active in the shell before Angular CLI commands run. `.nvmrc` records the expected version.
