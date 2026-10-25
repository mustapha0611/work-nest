---
name: code-review
description: Review WorkNest changes for correctness, security, maintainability, design-system consistency, tests, and learning value.
---

# Code Review Workflow

Review the diff and surrounding code before commenting. Prioritize findings by severity and include file/line references when available.

Check:
- Correctness and edge cases.
- Authentication, authorization, workspace isolation, and input validation.
- Frontend/backend responsibility boundaries and folder conventions.
- API contract consistency and safe error handling.
- Type safety and unnecessary complexity.
- Reuse of existing design tokens/components and accessible responsive behavior.
- Database relations, migration safety, query efficiency, pagination, and indexes where relevant.
- Test coverage for success and failure paths.
- Documentation and environment/secret hygiene.
- Scalability Now/Next/Later, without speculative infrastructure.

Separate confirmed defects from questions or optional improvements. Do not claim tests passed unless run. Explain the most important findings and ask the developer to reason through one trade-off or fix.
