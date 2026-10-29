# WorkNest Architecture

## Current status

Planning document. Update this as implementation decisions are approved and code exists. Do not describe planned functionality as implemented.

## Intended boundaries

- `frontend/`: Angular application and presentation/UI behavior.
- `backend/`: Express API, application rules, validation, and persistence integration.
- PostgreSQL: persistent relational data.
- Prisma: schema, migrations, and typed database access.

## Frontend conventions

- Feature-first organization.
- Feature API services live under each feature's `services/` directory.
- App-wide services belong in `core/services/`.
- Generic UI primitives belong in `shared/ui/`.
- Feature-specific models/types stay with their feature where practical.

## Backend conventions

- Group code by domain module.
- Keep routes, controllers, business services, validation, and data access distinct where useful.
- Use shared middleware for cross-cutting concerns.

## Decisions to record

- Package manager and workspace strategy.
- Angular styling/UI approach.
- Authentication/session strategy.
- Testing tools.
- API error format and validation library.
- Deployment target and environment strategy.
