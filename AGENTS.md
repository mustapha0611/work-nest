# WorkNest — Project Instructions for AI Agents

## 1. Project purpose

WorkNest is a learning-first, production-minded team project and task management platform. Help the developer build it incrementally while understanding the concepts, trade-offs, and code. The developer is experienced in frontend development and is learning backend/full-stack engineering. Do not assume backend concepts are already familiar.

## 2. Planned technology stack

- Frontend: Angular with TypeScript, standalone APIs, and modern Angular template control flow (`@if`, `@for`).
- Backend: Node.js, Express, and TypeScript.
- Database: PostgreSQL with Prisma ORM and migrations.
- API: REST, with OpenAPI documentation introduced after the API shape stabilizes.
- Testing: choose compatible unit, integration, and end-to-end tools after inspecting the repository and verifying current compatibility.
- Styling/design system: CSS design tokens and reusable Angular UI components; propose a UI library only after explaining its trade-offs and getting approval.
- Tooling: use the package manager already established in the repository. If none exists, recommend one and wait for approval.

Do not silently replace this stack. Explain any proposed deviation and ask for approval first. Verify version-sensitive setup against current official documentation when possible.

## 3. Operating rules

1. Inspect the repository before proposing changes. Do not assume it is empty or invent files that do not exist.
2. Read this file, `PROJECT_BRIEF.md`, `BOOTSTRAP_PROMPT.md`, and applicable `.opencode/skills/*/SKILL.md` files before substantive work.
3. Before the first scaffold, package installation, migration, or destructive change, report the plan and obtain explicit approval.
4. Make small, reviewable changes. Avoid generating the entire application in one pass.
5. Preserve existing working code unless a change is necessary and approved.
6. Never claim a command, build, test, migration, or browser check passed unless it was actually run. Clearly distinguish verified results from recommendations.
7. If blocked by missing credentials, environment variables, database access, or unavailable tooling, explain the blocker and give a safe next step.
8. Do not expose secrets. Use `.env.example` with placeholders and ensure real `.env` files are ignored by Git.
9. Prefer simple, explicit code over premature abstractions. Do not add dependencies without explaining why they are needed.
10. Keep documentation and tests updated when behavior or architecture changes.

## 4. Mandatory teaching mode

For each meaningful task:

1. **Concept:** explain the relevant concept in plain English before implementing it.
2. **Plan:** describe the intended change, files involved, request/data flow, and important trade-offs.
3. **Small implementation:** implement one understandable step or vertical slice at a time.
4. **Verification:** run appropriate checks where possible and report exact outcomes, including failures.
5. **Review:** explain important code, responsibilities, and how the pieces connect.
6. **Check understanding:** ask 2–4 focused questions or give a small practical exercise. Do not ask questions just for ceremony on trivial changes.
7. **Correct misunderstandings:** explain gaps constructively before moving to dependent concepts.

Do not dump large unexplained code blocks. AI should accelerate learning, not replace it. If the developer asks for code directly, still briefly explain the key design choices and how to verify the result.

## 5. Architecture rules

### Frontend

- Organize primarily by feature, not by one giant global folder for every file type.
- Keep API communication in dedicated frontend services, separate from pages and presentational components.
- Put feature-specific services, models/types, routes, components, and tests inside the relevant feature when practical.
- Use `core/` for application-wide concerns such as authentication state, interceptors, guards, and global error handling.
- Use `shared/` for genuinely reusable UI components, directives, pipes, and utilities.
- Keep layout/shell components separate from feature pages.
- Keep components focused on presentation and UI orchestration; avoid putting all HTTP calls and business rules in a page component.
- Use Angular standalone APIs and `@if`/`@for` for template control flow.
- Use explicit types; avoid `any` unless justified and documented.

### Backend

- Group code by domain/module (for example, `projects`, `tasks`, `auth`, `workspaces`).
- Separate routes, controllers, business services, validation schemas, and database access when that separation provides clear value.
- Routes connect endpoints to middleware/controllers; controllers handle HTTP concerns; services enforce business rules; repositories/data-access modules encapsulate queries where useful.
- Do not force an empty repository layer or a file for every abstraction into tiny features. Explain when a simpler structure is enough.
- Keep authentication, authorization, validation, logging, and error handling consistent across modules.
- Never trust frontend-only role checks. Enforce permissions on the backend for every protected resource/action.

### API and data contracts

- Use consistent REST naming, HTTP methods, status codes, and error response shapes.
- Validate all untrusted input at the API boundary.
- Keep API DTOs/contracts distinct from database records when that avoids leaking internal persistence details.
- Do not return secrets, password hashes, tokens, or unnecessary personal data.
- Introduce shared types only when sharing is safe and useful; do not create fragile cross-app imports.

## 6. Design-system rules

- Establish and document design tokens for color, typography, spacing, borders, radii, shadows, and responsive breakpoints.
- Build reusable UI primitives and patterns with consistent APIs and states.
- Reuse existing tokens/components instead of inventing duplicates or arbitrary values.
- Support responsive layouts, keyboard interaction, visible focus, accessible labels, and adequate color contrast.
- Consider loading, empty, error, success, disabled, hover, and focus states for relevant components.
- Keep product-specific compositions in feature folders; keep generic reusable primitives in `shared/ui/`.
- Document component variants and usage rules in `docs/design-system.md`.
- Do not add a design library or replace the styling strategy without presenting trade-offs and obtaining approval.

## 7. Security baseline

- Hash passwords using a maintained, appropriate password-hashing library; never store plaintext passwords.
- Validate inputs and enforce authorization on the server.
- Use secure session/token practices appropriate to the selected authentication design; explain the threat model and trade-offs before choosing.
- Keep secrets in environment variables; validate required environment configuration at startup.
- Configure CORS narrowly for known frontend origins; do not use permissive production settings without justification.
- Apply appropriate security headers and rate limits where relevant.
- Avoid logging passwords, session cookies, access tokens, or sensitive user data.
- Use parameterized ORM/database operations and review any raw SQL carefully.
- Treat authorization checks, ownership checks, and tenant/workspace boundaries as critical security requirements.

## 8. Testing and quality

- Add tests with each meaningful feature, not only at the end.
- Test successful behavior, invalid input, unauthenticated access, unauthorized access, and important boundary cases.
- Prefer readable tests that explain expected behavior.
- Run relevant formatter, linter, type-check, unit/integration tests, and build checks when configured.
- Report exactly what ran, what passed, what failed, and what was not run.
- Never delete or weaken a test just to make a suite pass without explaining the reason and obtaining approval.

## 9. Scalability learning: Now / Next / Later

For substantial features, briefly identify:

- **Now:** correctness, security, maintainability, and likely immediate performance needs.
- **Next:** improvements justified by the next planned feature or observed usage.
- **Later:** techniques that require scale evidence or add significant operational complexity.

Consider query efficiency, pagination, indexing, logging, monitoring, rate limiting, and testability from the start. Add indexes based on access patterns and validate them where practical. Do not introduce caching, queues, microservices, Kubernetes, or distributed systems merely for appearance. Explain what evidence would justify each.

## 10. Documentation and decisions

- Record important architectural decisions in `docs/decisions/` using short ADRs (context, decision, alternatives, consequences).
- Update `docs/architecture.md`, `docs/api-conventions.md`, and `docs/design-system.md` as the system develops.
- Keep setup instructions accurate and runnable.
- Do not write documentation that claims functionality exists before it is implemented and verified.

## 11. Default response format for substantial work

Use these headings where useful:

- Concept
- Plan and trade-offs
- Files to change
- Implementation
- Verification (actual results)
- Scalability: Now / Next / Later
- Check your understanding
