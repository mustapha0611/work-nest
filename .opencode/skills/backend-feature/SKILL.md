---
name: backend-feature
description: Plan and implement a WorkNest backend feature with clear Express boundaries, validation, authorization, tests, and teaching.
---

# Backend Feature Workflow

Use this skill when adding or changing an Express API feature.

1. Read `AGENTS.md`, `PROJECT_BRIEF.md`, and relevant architecture/API docs.
2. Inspect the existing module and conventions before editing. Do not assume the file layout.
3. Explain the backend concepts and trace the request flow: route → middleware → validation → controller → service/business rules → data access/Prisma → response/error handler.
4. List the intended files and responsibility of each before making a substantial change.
5. Keep HTTP concerns in controllers and business rules in services. Use a repository/data-access layer when it provides meaningful separation; do not add it mechanically.
6. Validate untrusted request input at the boundary. Use consistent status codes and error shapes.
7. Enforce authentication, workspace membership, resource ownership, and role permissions on the server wherever required. Frontend checks are not security controls.
8. Add tests for success, invalid input, not found, unauthenticated access, unauthorized access, and relevant edge cases.
9. Run relevant checks and report actual commands/results. Never claim success for checks not run.
10. Describe scalability as Now/Next/Later, considering query shape, pagination, indexes, rate limits, logs, and monitoring without premature infrastructure.
11. Walk through the important code and finish with 2–4 understanding questions or a small exercise.
