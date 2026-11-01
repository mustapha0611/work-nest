# Specs

Every WorkNest change gets the same structure, whether it is a one-line fix or a multi-phase
feature. The workflow that uses these files is `.opencode/skills/orchestration/SKILL.md`; the
diagrams are in [orchestration.md](../orchestration.md).

## Create a spec

1. Pick the next unused number: `SPEC-001`, `SPEC-002`, ...
2. Derive a short kebab-case slug from the title.
3. Create `docs/specs/SPEC-NNN-slug/`.
4. Copy the templates from `_templates/` and fill them in:

| Template                  | Destination                       |
| ------------------------- | --------------------------------- |
| `_templates/SPEC.md`      | `SPEC.md`                         |
| `_templates/PHASE.md`     | `phases/phase-N-name.md`          |
| `_templates/CHECKLIST.md` | `checklists/phase-N-checklist.md` |
| `_templates/PROGRESS.md`  | `PROGRESS.md`                     |

A one-line fix still gets one phase, one checklist, and a `PROGRESS.md`. The plan stays in the
conversation until `/build` creates the spec.

## Status values

`pending` · `in_progress` · `impl_done` · `validated` · `reviewed` · `awaiting_approval` ·
`approved` · `blocked`

The full state machine, cycle accounting, evidence gate, and approval gates live in the
orchestration skill.

## Rules

- `PROGRESS.md` is the single source of truth. Update it after every agent action.
- A phase is not done until the user approves it.
- Three failed implement → validate → review cycles set the phase to `blocked`.
- Never mark a check as passed without terminal evidence.
- Surface every SKIP and CONCERN before asking for approval.
- Do not edit an applied migration, weaken a test, or add a dependency inside a phase.
- When behavior, architecture, or an API contract changes, update the relevant doc or add an ADR
  (`AGENTS.md §10`).
