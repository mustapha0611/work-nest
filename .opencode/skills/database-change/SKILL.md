---
name: database-change
description: Design and safely evolve WorkNest PostgreSQL/Prisma models, constraints, relations, migrations, and queries.
---

# Database Change Workflow

1. Inspect `schema.prisma`, migrations, existing data-access patterns, and relevant feature rules.
2. Explain the domain relationship and why the proposed model/constraint is needed.
3. Identify ownership and workspace boundaries. Consider how the database model supports authorization without treating the schema as a substitute for application checks.
4. Explain relations, optionality, uniqueness, deletion behavior, and likely query patterns before changing the schema.
5. Use Prisma migrations; do not edit an already-applied migration casually. Explain migration safety and data-loss risks.
6. Avoid destructive resets or commands that can erase data without explicit approval.
7. Consider indexes based on expected filters, joins, ordering, and pagination. Do not add indexes without a reason.
8. Update relevant tests and docs. Run schema validation, migration checks, and tests when available; report actual results.
9. Identify performance/scalability implications as Now/Next/Later.
10. Explain the final schema and ask 2–4 questions or a small query/modeling exercise.
