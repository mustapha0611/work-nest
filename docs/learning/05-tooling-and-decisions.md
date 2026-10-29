# 05 — Tooling and decisions you should be able to defend

Each row answers "why not the obvious alternative?" — the question you will get in a review.

## npm workspaces

One repository, two applications, one lockfile.

```json
"workspaces": ["frontend", "backend"]
```

```powershell
npm install            # installs both
npm run lint -w backend
npm ls typescript
```

**What you gain**

- One install, one lockfile, one `npm ci` in CI.
- Atomic changes: an API contract change and its consumer land in one commit and one review.
- Shared tooling (Prettier) configured once.

**What you give up**

- npm hoists dependencies to the root, so a workspace can accidentally depend on something it never
  declared. `npm ls <pkg>` is the diagnostic.
- Workspace-specific version conflicts are possible and must be understood, not feared.

`-w` selects a workspace by directory (`backend`) or package name (`@worknest/backend`).

Alternatives: pnpm workspaces (stricter, faster, another tool to learn), Nx/Turborepo (orchestration
that two apps do not need yet), separate repositories (duplicated tooling, harder contract changes).

## Two TypeScript versions

| Workspace | TypeScript | Why                                         |
| --------- | ---------- | ------------------------------------------- |
| frontend  | `6.0.3`    | Angular 22 requires `>=6.0 <6.1`            |
| backend   | `5.9.3`    | Prisma 7 documents 5.9.x as the tested line |

npm installs both and resolves per workspace. This is expected, not a defect. Consequence: **do not
import raw TypeScript source across workspaces.** If shared contracts are needed, generate plain DTO
types or design them for both compilers.

See [ADR 0002](../decisions/0002-runtime-and-typescript-versions.md).

## ESM backend, CommonJS lint config

`backend/package.json` sets `"type": "module"`, so `eslint.config.js` there uses `import` and
`import.meta.dirname`.

`frontend/package.json` does not, so its ESLint config is CommonJS (`require`). Angular's CLI
generated it that way.

Same flat-config format, different module system — a good reminder that `"type": "module"` is a
package-level decision, not a file-level one.

## Two lint stacks, on purpose

| Workspace | Tool                                | Reason                                     |
| --------- | ----------------------------------- | ------------------------------------------ |
| backend   | `eslint` + `typescript-eslint`      | Server code, no templates                  |
| frontend  | `angular-eslint` (+ template rules) | Component selectors, accessibility in HTML |

The frontend config also uses `angular.processInlineTemplates`, which extracts inline templates so
template rules apply to them.

Backend lint runs with type information (`projectService: true`), which is why rules like
`no-floating-promises` can catch a missing `await`. `eslint.config.js` itself is excluded from
linting because it is plain JavaScript outside the TypeScript project.

## One formatter

Prettier is a root dependency with a single configuration. `ng new` generates `frontend/.prettierrc`;
that file was deleted along with the CLI's `.editorconfig`, `.gitignore`, and `README.md`.

Reason: four overlapping configs eventually disagree. One authoritative rule set per repository.

## Root scripts

| Script              | Behaviour                                            |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | `concurrently` runs API and web with prefixed output |
| `npm run build`     | backend then frontend                                |
| `npm test`          | backend then frontend, both non-watch                |
| `npm run lint`      | both workspaces                                      |
| `npm run typecheck` | both workspaces                                      |
| `npm run format`    | Prettier across the repository                       |

`concurrently` is the only added root dependency. Its value is one terminal, labelled output, and a
single Ctrl+C that stops both processes.

## Build and test pipeline choices

| Choice                     | Alternative          | Trade-off                                                  |
| -------------------------- | -------------------- | ---------------------------------------------------------- |
| `tsx` in dev               | `ts-node`, `esbuild` | Native Node semantics in production; slower than a bundler |
| `tsc` for production build | `esbuild` bundle     | Predictable output, no bundling step; no tree shaking      |
| Vitest + Supertest (API)   | Jest, node:test      | Shares the test runner with the frontend                   |
| Angular unit-test builder  | Karma + Jasmine      | Vitest, jsdom, no browser required                         |
| Playwright later           | Cypress              | Real browser, good trace viewer; add when flows are stable |

## Deliberate gaps

| Missing                    | Why it is correct now                           | Arrives with |
| -------------------------- | ----------------------------------------------- | ------------ |
| Database queries           | Nothing to persist                              | M3           |
| Prisma client              | No schema; generating would prove nothing       | M3           |
| Authentication / sessions  | Needs users, hashing, cookies designed together | M4           |
| Request body validation    | Only `GET` endpoints exist                      | M4 / M6      |
| Rate limiting              | Nothing guessable or expensive to protect       | M4           |
| Request IDs / tracing      | Single service; add when logs need correlation  | Next         |
| OpenAPI                    | API shape still moving                          | After M6     |
| Docker images for the apps | Local dev only so far                           | Deploy step  |

The principle: **add a layer when the complexity it removes is larger than the complexity it adds.** A
`HealthService` would be a pass-through today; a `ProjectService` with membership checks will not be.

## Scalability: Now / Next / Later

**Now**

- One PostgreSQL instance, separate development and test databases.
- Strict TypeScript, validated configuration, one error shape.
- In-process tests that stay fast as modules are added.

**Next**

- Request-body validation with the same Zod schemas.
- A readiness probe that checks the database.
- CI with `npm ci`, lint, typecheck, test, build, and the same PostgreSQL image.
- Structured log shipping once there are multiple environments.

**Later**

- Rate limiting at the auth boundary, per-request tracing, metrics.
- Connection pooling tuning based on measured contention.
- Read replicas or caching only with evidence; no Redis, queues, or microservices for appearance.

## Related

- [ADR 0001](../decisions/0001-monorepo-and-npm-workspaces.md) — monorepo and npm workspaces
- [ADR 0002](../decisions/0002-runtime-and-typescript-versions.md) — Node and TypeScript versions
- [ADR 0003](../decisions/0003-postgresql-and-prisma-versions.md) — PostgreSQL and Prisma versions
