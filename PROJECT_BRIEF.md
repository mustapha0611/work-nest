# WorkNest — Project Brief

## Product vision
WorkNest is a team project and task management platform for small teams. Members work inside a workspace, collaborate on projects, create and assign tasks, track status and priority, and manage access based on roles.

## Why this project
It provides realistic full-stack learning opportunities: UI architecture and a design system, API contracts, authentication, authorization, relational data modeling, testing, deployment, security, and measured scalability—without requiring microservices or other premature complexity.

## Target users and roles
- **Workspace owner:** manages workspace settings, membership, and ownership-level actions.
- **Workspace admin:** manages members and projects within permitted scope.
- **Member:** views permitted projects and creates/updates tasks according to workspace rules.

Exact permission rules must be documented and tested before implementation. Do not assume hiding a frontend button provides security.

## Initial functional scope
1. Register and sign in securely.
2. Create and manage a workspace.
3. Invite/add members using a simple initial flow; external email invitations can be deferred.
4. Create, view, update, and archive projects.
5. Create, assign, view, update, and delete tasks according to permissions.
6. Track task status, priority, due date, and assignee.
7. Search/filter and paginate project/task lists.
8. Provide a dashboard with useful counts and recent tasks.
9. Show consistent loading, empty, error, and success states.
10. Document API endpoints and provide automated tests.

## Explicitly out of scope for the first version
- Microservices
- Kubernetes
- Real-time collaboration/web sockets
- Billing/subscriptions
- Complex external email workflows
- Advanced analytics
- Multi-region deployment
- Event-driven architecture or queues without a demonstrated requirement

## Proposed stack
- Angular + TypeScript, standalone components/APIs.
- Node.js + Express + TypeScript.
- PostgreSQL + Prisma.
- REST API; OpenAPI docs after initial endpoints stabilize.
- CSS design tokens and reusable Angular components; UI library choice is an approval decision.
- Testing/lint/format tools selected after repository inspection and version compatibility checks.

## Architecture direction
- Monorepo with `frontend/` and `backend/`.
- Frontend organized by feature. Feature API services live in feature `services/` folders; app-wide services live in `core/services/`; generic reusable UI lives in `shared/ui/`.
- Backend grouped by domain modules, with clear route/controller/service/validation/data-access responsibilities where justified.
- PostgreSQL schema and Prisma migrations are the source of truth for database evolution.
- Keep boundaries understandable; avoid empty folders and needless abstraction.

## Design system scope
Create design tokens for colors, typography, spacing, borders/radii, shadows, and breakpoints. Establish a small first set of reusable components (button, text field, select, badge, avatar, toast/notification, dialog, loading indicator, and empty/error state) as needed. Create an accessible responsive application shell with sidebar/topbar. Document component variants and usage. Build only the components needed by upcoming screens rather than creating a huge speculative library.

## Learning outcomes
The developer should be able to explain and modify:
- Angular feature architecture, dependency injection, forms, routing, and HTTP services.
- Express request lifecycle, middleware, controllers, services, validation, and error handling.
- HTTP methods/status codes and API contracts.
- PostgreSQL relationships, constraints, migrations, indexes, and Prisma queries.
- Authentication versus authorization, identity, ownership, and workspace boundaries.
- Unit/integration/end-to-end testing and debugging.
- Environment configuration, security basics, deployment, logging, and measured performance improvements.

## Milestones
1. Inspect repo, existing instructions, tools, and runtime versions. Propose structure and decisions; do not install or scaffold before approval.
2. Agree on monorepo/package-manager approach, Angular styling/UI approach, testing tools, and initial auth strategy.
3. Create minimal runnable frontend/backend with a health endpoint and environment validation.
4. Document the request lifecycle and establish baseline lint/type-check/test commands.
5. Define initial design tokens and application shell; build a small set of UI primitives.
6. Model users/workspaces/memberships/projects/tasks; create migrations and explain relationships/constraints.
7. Implement a complete project vertical slice: API validation, service logic, data access, tests, Angular service/page, and UI states.
8. Add authentication and server-side authorization with tests.
9. Add task management, filters/search/pagination, and dashboard.
10. Add API documentation, accessibility review, security review, deployment, logging, and performance checks.
11. Identify measured or plausible bottlenecks and classify improvements as Now/Next/Later.

## Definition of done for a feature
- Responsibilities are placed in the correct folders.
- Validation and authorization are implemented at the appropriate server boundary.
- Success, error, loading, empty, and permission-denied states are considered where relevant.
- Relevant automated tests are added and run when possible.
- The developer receives a plain-English walkthrough and a short understanding check.
- Documentation is updated if contracts or architecture changed.
- Verification results are reported truthfully.
