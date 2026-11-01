---
name: orchestration
description: Run WorkNest changes through an implement → validate → review loop with evidence gates, approval gates, teaching checkpoints, and progress tracking.
---

# WorkNest Orchestration

Use this skill for any change that touches code, tests, schema, or docs. A one-line fix and a
multi-phase feature use the same loop; only the number of phases changes.

This skill coordinates the domain skills (`backend-feature`, `frontend-feature`, `database-change`,
`design-system`, `auth-security-review`, `code-review`, `testing-debugging`). It does not replace
them.

## Roles

| Role | Agent | Job |
|---|---|---|
| Orchestrator | `orchestrator` | Plan, dispatch, track, enforce gates, teach |
| Implementer | `implementer` | Write the scoped change and its tests |
| Validator | `validator` | Prove it works with evidence |
| Reviewer | `reviewer` | Judge correctness, security, design |

`explore` is available for reconnaissance and `general` for one-off research. Neither replaces a
role in the loop.

What each role may edit or run is declared in its agent file under `.opencode/agents/` and enforced
by the harness; `docs/orchestration.md` shows the human-readable view. The orchestrator may re-run a
check only to verify a reported result; the validator's evidence remains the record.

## Status machine

```text
pending → in_progress → impl_done → validated → reviewed → awaiting_approval → approved
              ↑              |            |            |
              └──── FAIL ────┴──── FAIL ──┴──── FAIL ──┘      (3 cycles → blocked)
```

| Status | Meaning |
|---|---|
| `pending` | Phase not started |
| `in_progress` | Implementation or rework is underway |
| `impl_done` | Implementation finished, awaiting validation |
| `validated` | Validator passed with evidence |
| `reviewed` | Reviewer passed; concerns may be listed for the user |
| `awaiting_approval` | Waiting for the user |
| `approved` | User approved; phase complete |
| `blocked` | Needs a human decision (3 failed cycles, missing access, or unclear scope) |

## Cycle accounting

One **cycle** is one implement → validate → review pass that ends in FAIL.

- A review FAIL re-runs validation before the next review.
- The one-time re-dispatch for a report with no Terminal Evidence does **not** count. A second
  evidence-less report is a FAIL and does count.
- Reset the counter to `0/3` on `approved` and when the user redirects the implementation.
- Three failed cycles set the phase to `blocked`.

## Phase lifecycle

1. Read `SPEC.md`, `phases/phase-N-*.md`, and `checklists/phase-N-checklist.md`.
2. **Teaching checkpoint.** State the concept, the plan, the files, and the trade-offs before any
   code is written. Stop for approval on anything gated (see below).
3. Dispatch `implementer` with a self-contained brief.
4. If the implementer reports a blocker, keep the phase `in_progress` and escalate. Set `blocked`
   when a human decision is required.
5. Update `PROGRESS.md`: `impl_done`.
6. Dispatch `validator`. Enforce the evidence gate before reading its verdict.
7. On validation FAIL: set `in_progress`, pass the error context to `implementer`, increment the
   cycle, and re-validate.
8. Update `PROGRESS.md`: `validated`.
9. Dispatch `reviewer`.
10. On review FAIL: set `in_progress`, pass the findings to `implementer`, increment the cycle,
    re-validate, then re-review.
11. Update `PROGRESS.md`: `reviewed`.
12. Surface every SKIP and CONCERN to the user, then set `awaiting_approval`.
13. Present the result, ask 2–4 understanding questions, and wait for explicit approval.
14. On approval: `approved`, tick the checklist, move to the next phase.

## Evidence gate

The validator's report is only valid if it contains a **Terminal Evidence** section with real
output and exit codes for **every command listed in the brief or checklist**.

- A PASS or SKIP without evidence is treated as **FAIL**.
- A SKIP must name the command attempted and the reason. A missing script may have no output, but
  the attempt must still be shown. A SKIP is never a PASS.
- On a missing evidence section, re-dispatch the validator once with this instruction prepended:
  "Your previous report lacked terminal evidence. Re-run every command and paste the actual
  stdout/stderr with exit codes."
- The orchestrator never upgrades a validator FAIL to a PASS.
- A validator PASS with a reviewer FAIL is still a FAIL.

## Approval gates

Stop and ask the user before:

- Adding or upgrading a dependency.
- Creating or running a Prisma migration.
- Any destructive or irreversible command (`rm`, `DROP`, `git reset --hard`, force push).
- Writing, rotating, or exposing a secret.
- Changing scope beyond the approved phase.
- Accepting a phase with outstanding SKIPs.

These are never delegated to a subagent.

## Teaching checkpoints

`AGENTS.md §4` applies to the whole loop:

- Before implementation: concept, plan, files, trade-offs.
- After review: explain what changed and how the pieces connect.
- Then ask 2–4 focused questions or give a small exercise.
- Do not dump large unexplained code, even if a subagent produced it.

## Validation commands

Run in this order, fastest feedback first. Use the workspace-aware scripts at the repo root.

```bash
npm run typecheck       # backend tsc --noEmit, then frontend tsc --noEmit
npm run lint            # backend eslint, then frontend ng lint
npm test                # backend vitest, then frontend ng test (vitest)
npm run build           # backend tsc build, then frontend ng build
npm run format:check    # prettier check, no writes
```

When the change touches the schema, migrations, or data access, add:

```bash
npm run db:generate -w backend   # regenerates the client and validates the schema
npm run test:db -w backend       # applies migrations to worknest_test, then runs *.db.test.ts
```

`npm test` never touches a database by design, so it cannot validate a schema change on its own. A
data-phase report without `test:db` evidence is incomplete, not a PASS. `test:db` needs PostgreSQL
from `docker compose up -d`; if the container is down, say so and report a SKIP with that reason.

A command that does not exist yet is never a PASS.

## Iron rules

Passed to every agent on every dispatch:

1. **Respect scope.** Touch only the files named in the phase. Do not refactor opportunistically.
2. **Follow existing patterns.** Match naming, structure, and style; do not introduce a new pattern.
3. **Test behavior.** Every behavior change gets tests covering success, invalid input, and the
   relevant authorization or boundary case. Never weaken or delete a test to make the suite pass.
4. **No new dependencies** without explicit approval and an explanation of why.
5. **No secrets.** Use `.env.example` placeholders; never log tokens, cookies, passwords, or keys.
6. **Authorization is server-side.** Workspace and ownership checks are enforced at the API
   boundary. A frontend check is not a security control.
7. **Small slices.** One understandable change at a time; no whole-feature dumps.
8. **Evidence or it did not happen.** Never claim a command, build, or test passed unless it ran.
9. **Migrations are additive.** Never edit an applied migration; add a new one.
10. **Update the record.** When behavior, architecture, or an API contract changes, update
    `docs/architecture.md`, `docs/api-conventions.md`, `docs/design-system.md`, or add an ADR in
    `docs/decisions/` (`AGENTS.md §10`). Describe scalability as Now / Next / Later.
11. **Stop when unclear.** Report the blocker instead of guessing.

## Brief templates

Every subagent starts with fresh context, so every brief must be self-contained. The one exception
is the validation command list: the validator reads it from the "Validation commands" section above
rather than receiving a copy that can drift.

### Implementer

```text
Goal:
Skill to load: <backend-feature | frontend-feature | database-change | design-system | ...>
Context: repo paths, relevant docs, existing patterns to match
Files to create/modify:
Files not to touch:
Constraints: iron rules, no new dependencies, small diff
Docs to update: architecture, API conventions, design system, or ADR (if behavior changed)
Acceptance criteria:
Do not run build, test, or lint commands; the validator does that.
Report back: files changed, anything not done, open questions.
```

### Validator

```text
Phase and files changed:
Commands to run: every command in "Validation commands" above, in that order.
Phase checklist to verify:
Report format: results table + a Terminal Evidence section with the actual
stdout/stderr and exit code for every command. SKIP requires the command
attempted and the reason.
Do not modify any file.
```

### Reviewer

```text
Phase scope and files changed:
Requirements and acceptance criteria:
Review for: correctness, security and authorization, API contract, tests,
design-system consistency, cross-feature impact, maintainability, and docs/ADR updates.
Report: PASS / CONCERN / FAIL per category with file:line evidence,
then an overall verdict and required changes. A CONCERN does not block; a FAIL does.
Do not modify any file.
```

## Spec workspace

Every change gets the same structure, whether it is one task or fifty:

```text
docs/specs/SPEC-NNN-slug/
  SPEC.md                          from _templates/SPEC.md
  phases/phase-N-name.md           from _templates/PHASE.md
  checklists/phase-N-checklist.md  from _templates/CHECKLIST.md
  PROGRESS.md                      from _templates/PROGRESS.md
```

Templates live in `docs/specs/_templates/`. Create the directory with the next unused `SPEC-NNN`
number and a kebab-case slug. A one-line fix still gets one phase, one checklist, and a
`PROGRESS.md`; the plan stays in the conversation until `/build` creates the spec.

## Failure recovery

- **Validation or review fails:** pass the error context back to the implementer, increment the
  cycle, and re-run the loop. Maximum 3 cycles.
- **Three cycles exhausted:** set the phase to `blocked`, keep the error output, and ask the user
  whether to adjust scope, provide a hint, or abandon the phase.
- **Subagent returns malformed output:** re-dispatch once with explicit formatting instructions.
- **Subagent reports a skipped check:** record the SKIP and reason; surface it before approval.
- **User rejects after review:** record the reason, re-implement, and run the full loop again. This
  does not count toward the 3-cycle limit.
- **Bug reproduction:** if the implementer needs a failing test to start, dispatch the validator
  first with the reproduction command. The implementer does not run tests.
