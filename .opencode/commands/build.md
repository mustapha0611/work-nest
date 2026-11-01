---
description: Execute a WorkNest change through implement → validate → review
agent: orchestrator
subagent: false
---

Execute the request through `.opencode/skills/orchestration/SKILL.md`.

1. **Find the plan.** Use the agreed plan from the conversation. If the work is not planned yet,
   stop and ask the user to run `/plan` first.
2. **Create the spec.** Create `docs/specs/SPEC-{next-number}-{slug}/` from
   `docs/specs/_templates/`: `SPEC.md`, `phases/`, `checklists/`, and `PROGRESS.md`.
3. **Run the loop per phase:** implementer → validator (evidence gate) → reviewer.
4. **Track everything** in `PROGRESS.md` and the phase checklist, including cycle counts and SKIPs.
5. **Stop for approval** on any dependency, migration, destructive command, secret, scope change, or
   outstanding SKIP.
6. **Update the record** when behavior, architecture, or an API contract changes: `docs/architecture.md`,
   `docs/api-conventions.md`, `docs/design-system.md`, or an ADR in `docs/decisions/`.
7. **Present for approval** with a summary, files changed, validation evidence, and review verdict.
   Then explain the code and ask 2–4 understanding questions.

Do not commit unless the user explicitly asks.

## Request

$ARGUMENTS
