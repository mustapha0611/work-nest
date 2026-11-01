---
description: Review WorkNest changes for correctness, security, contracts, tests, and design
agent: reviewer
subagent: true
---

Review the change described below. Read the diff and surrounding code first.

Check, with `file:line` evidence for every finding:

1. Correctness and edge cases.
2. Security and server-side authorization, including workspace and ownership boundaries.
3. API contract: naming, methods, status codes, error shape, no leaked persistence fields.
4. Tests: success, invalid input, unauthenticated, unauthorized, and boundary cases; no weakened
   tests.
5. Design-system reuse, accessibility, and loading/empty/error states.
6. Cross-feature impact.
7. Maintainability and layer responsibilities.

Report PASS / CONCERN / FAIL per category, then an overall verdict and required changes. Do not
modify any file or run builds and tests.

## Scope

$ARGUMENTS
