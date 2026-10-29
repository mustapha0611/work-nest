# Learning Notes

These notes explain **why** the code looks the way it does. They are written for a frontend
developer moving into full-stack work, so they translate backend concepts into ideas you already
use in Angular.

They are not API documentation. For the current system shape, read
[Architecture](../architecture.md) and [API conventions](../api-conventions.md).

## How to use them

1. Read the note that matches the milestone you just finished.
2. Run the exercises in [06-exercises.md](06-exercises.md) on a scratch branch.
3. Answer the understanding questions in your own words before starting the next milestone.
4. When code and notes disagree, the code wins — and the note should be fixed in the same change.

## Index

| Note                                                       | Covers                                                                     |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| [01-request-lifecycle.md](01-request-lifecycle.md)         | What happens between a click and a JSON response; Express middleware order |
| [02-backend-runtime.md](02-backend-runtime.md)             | Node process model, ESM, TypeScript build split, config, errors, shutdown  |
| [03-security-basics.md](03-security-basics.md)             | Helmet, CORS versus same-origin, the dev proxy, what must never be logged  |
| [04-frontend-notes.md](04-frontend-notes.md)               | Zoneless change detection, signal state machines, service boundaries       |
| [05-tooling-and-decisions.md](05-tooling-and-decisions.md) | npm workspaces, two TypeScript versions, lint configs, accepted trade-offs |
| [06-exercises.md](06-exercises.md)                         | Reversible experiments and review questions                                |

## Code example style

**Balanced.** Notes are written after a milestone is implemented and verified, and examples follow
these rules:

- Annotated snippets for every non-obvious decision: types, ordering, library choice, error paths.
- Straightforward code is linked by file path instead of pasted.
- Where it helps, show the naive version, what breaks, then the corrected version.
- Include a test snippet when it encodes behaviour that is easy to regress.
- Show commands with their expected output so verification is reproducible.
- No whole-file dumps. The repository is the source of truth for complete code.

## Scope

M1 (toolchain skeleton) as of 2026-10-29. Notes are added per milestone rather than written
up front; anything not yet implemented is described as a gap, not as a feature.
