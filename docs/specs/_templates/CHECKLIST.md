# Phase {N} checklist

## Files

- [ ] Only the files declared in the phase were created or modified.

## Behavior

- [ ] The phase goal is met.
- [ ] Invalid input and boundary cases are handled.
- [ ] Loading, empty, error, and success states are handled where relevant.

## Validation

- [ ] Every command in the orchestration skill's "Validation commands" list passes — evidence
      attached.
- [ ] Every SKIP has a reason and was surfaced to the user.

## Iron rules

- [ ] No new dependency without approval.
- [ ] No secrets, tokens, or passwords committed or logged.
- [ ] Authorization enforced server-side (if the phase touches an API).
- [ ] Tests cover success and failure paths; no test was weakened.
- [ ] Migrations are additive and no applied migration was edited.
- [ ] Architecture, API conventions, design system, or ADR updated if behavior changed.

## Sign-off

- Implementer:
- Validator:
- Reviewer:
- User:
