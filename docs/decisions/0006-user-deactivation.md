# ADR 0006: Accounts are deactivated, not deleted

- Status: Accepted
- Date: 2026-11-01

## Context

M3 gave `User` no delete path, and [ADR 0005](0005-no-hard-deletes.md) deferred the question:

> Users have no delete path at all yet. Deactivation is an authentication concern for a later
> milestone and will be decided there.

M4 adds login and database-backed sessions, so "how do we turn an account off?" stops being
hypothetical. A person leaves a team; their tasks, comments and authorship must survive, but they
must not be able to sign in.

Two mechanisms are plausible and they answer different questions:

- **Remove their memberships.** Access is workspace-scoped, so dropping the rows removes access.
  Nothing on the account changes.
- **Mark the account itself.** A flag or timestamp on `User` that every authenticated request checks.

The schema already constrains part of the answer: `Task.createdById` is `ON DELETE RESTRICT`, so a
user who authored work cannot be deleted at all. Deletion is therefore not the operation we need.

## Decision

- `User` gains `deactivatedAt DateTime?`. `NULL` means the account is active. There is no
  `isActive` boolean: a nullable timestamp answers "is it disabled" and "since when" with one column.
- `requireAuth` rejects any request whose user has `deactivatedAt` set. The check lives in the
  middleware that already loads the user, so it costs nothing extra.
- Deactivation also deletes that user's sessions. This is defence in depth: revocation takes effect
  immediately instead of on the next request that happens to load the user, and the deleted session
  rows leave an audit trail of the cut-off.
- Deactivation changes nothing else. Memberships, projects, tasks and authorship stay exactly as they
  are, so history remains readable and `createdById` keeps pointing at a real person.
- There is still no delete path for users. A genuine erasure request needs a separate, deliberate
  operation, as ADR 0005 already states.

The column and the middleware check are implemented in M4, together with the sessions table, so the
schema change ships with the code that reads it.

## Alternatives considered

- **Remove memberships only.** Leaves an account that can still sign in and see an empty application,
  which is a confusing state rather than a disabled one. "No memberships" cannot distinguish "left
  every workspace" from "just signed up". Re-inviting the person also silently restores access, which
  is wrong if the account was deactivated because it was compromised.
- **`isActive` boolean.** Equivalent in cost, but throws away the date. Disabling without recording
  when makes the audit trail impossible to reconstruct.
- **`deletedAt` on `User`.** Conflates "disabled" with "gone" and invites a delete endpoint that
  `RESTRICT` will refuse anyway. It would also leave the email address occupied by a row everyone is
  told to treat as absent.
- **Deleting the user row.** Blocked by `RESTRICT` once they have authored a task, and destroys the
  attribution that makes history readable.

## Consequences

- Every authenticated request costs one null check on `deactivatedAt`.
- The email address stays reserved to the deactivated account. Re-joining means reactivating, not
  creating a second account — good for audit, and it means an admin flow must exist for reactivation.
- Member lists, assignee pickers and mention lists must filter `deactivatedAt: null`. That is a second
  filter to remember alongside `Task.deletedAt`, and the same failure mode: forget it and a
  deactivated person reappears in a dropdown.
- Reactivation is a normal update: clear the timestamp. No data has to be restored.
- The `User` model now has two lifecycle concepts to keep straight — deactivated accounts still have
  live memberships — so the product rules for "who can be assigned work" need to consider both.
