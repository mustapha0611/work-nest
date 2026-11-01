# ADR 0004: One branch per concern

- Status: Accepted
- Date: 2026-11-01

## Context

WorkNest is built one milestone at a time, and each milestone so far has used a single long-lived
branch: `feat/m1-scaffold`, then `feat/m2-design-system`. Branches are merged with `--no-ff`, so each
one leaves a marker on `main`.

In practice a milestone branch collected everything touched while that milestone was open, not just
the milestone's own work. `feat/m2-design-system` carried three unrelated commits:

- the design tokens and the button/badge primitives — genuinely M2;
- a correction to the milestone list in `PROJECT_BRIEF.md` — documentation;
- the agent orchestration workflow, roughly 1000 lines of tooling.

All three reached `main` under a merge commit labelled as M2. The branch name stopped predicting the
contents.

The cost is not correctness; each commit is clean. The cost is granularity. Reverting the M2 merge
would also remove the orchestration workflow. Cherry-picking the tokens elsewhere would bring the
agents with them. And `git log` no longer answers "when did the design system land?" without opening
the merge.

This is the same failure as a duplicated fact with two homes: a label that no longer matches what it
refers to.

## Decision

- One branch per concern. A concern is one change that could be reverted on its own.
- Name branches `type/concern`: `feat/m3-prisma-schema`, `chore/agent-workflow`,
  `docs/branch-per-concern`.
- A milestone may still have its own branch for the milestone's own work. Work that is not the
  milestone's — tooling, documentation corrections, refactors — gets a separate branch, even when it
  is written in the same sitting.
- Merge with `--no-ff` so each concern keeps its own marker on `main`.
- Test before opening a branch: "If I reverted this branch tomorrow, would I lose anything I want to
  keep?" If yes, it is more than one concern.

## Alternatives considered

- **One long-lived branch per milestone, which was the previous practice.** Fewer branches, but every
  merge becomes an all-or-nothing unit and the branch name degrades into a period label rather than
  a description of contents.
- **Trunk-based development with no branches.** The fastest feedback loop and no merge ceremony, but
  it removes the revert granularity this project wants while it is still learning, and it assumes a
  test suite and review process strong enough to commit straight to `main`.
- **Rewriting `feat/m2-design-system` into separate branches before merging.** Would have produced a
  cleaner history, but rewriting costs more than the labelling problem it fixes, and the commit
  bodies already record what is inside.

## Consequences

- More branches and more merge commits; `git log --merges --oneline` becomes a list of concerns
  rather than a list of milestones.
- Any single concern can be reverted or cherry-picked without dragging unrelated files with it.
- A branch name predicts its contents, so `git log`, `git branch`, and merge messages stay
  trustworthy without opening the diffs.
- Merging one concern no longer waits for unrelated work in the same branch to be finished.
- The convention only helps if it is applied when the branch is created. A branch that has already
  mixed concerns cannot be separated later without rewriting history.
