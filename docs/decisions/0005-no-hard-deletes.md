# ADR 0005: Projects and tasks are never hard-deleted

- Status: Accepted
- Date: 2026-11-01

## Context

The M3 schema models workspaces, memberships, projects, and tasks. Two questions
had to be answered before the migration could be written: what happens when a
project is removed, and what happens when a task is removed.

A hard delete is irreversible. It also removes rows that other data points at:
deleting a project either orphans its tasks or cascades them away, and deleting
a task erases the record of work that was planned and possibly done. In a team
tool, the record of "we planned this, then dropped it" is information, not
clutter. Product briefs for tools like this describe "archive", not "delete".

At the same time, keeping every row forever has a cost: every query has to
exclude the removed ones, and a forgotten filter silently resurfaces deleted
data.

## Decision

- **Projects** are archived, never deleted. `Project.status` moves from `ACTIVE`
  to `ARCHIVED` and `Project.archivedAt` records when. There is no delete path.
- **Tasks** are soft-deleted. `Task.deletedAt` is set instead of removing the
  row. There is no delete path.
- Queries filter on `status: ACTIVE` or `deletedAt: null`. The filter is part of
  every read, not an optional convenience.
- Relations still declare cascades for the rows that genuinely belong to a
  parent: deleting a workspace removes its memberships and projects, and
  deleting a project removes its tasks. Those cascades are only reachable
  through administrative or test paths, not through a product endpoint.
- Users have no delete path at all yet. Deactivation is an authentication
  concern for a later milestone and will be decided there.

## Alternatives considered

- **Hard delete with `ON DELETE CASCADE`.** Simplest schema and no filter
  burden, but destroys history and makes an accidental deletion unrecoverable.
- **Archive projects, hard-delete tasks.** Half the benefit. Tasks are the
  higher-volume rows and the ones users are most likely to remove by mistake.
- **A single `deletedAt` on both models.** Uniform, but a project that is
  archived is still fully readable and active in reporting, which is not the
  same as deleted. One column would conflate two states.
- **Database triggers or views that hide soft-deleted rows automatically.** Would
  remove the filter burden, but hides behaviour in the database, complicates
  migrations, and makes it harder to reason about a query from the code alone.

## Consequences

- Every task query must include `deletedAt: null`. A missing filter is a bug
  that tests have to catch; it is the main risk this decision introduces.
- Counting, pagination, and search must apply the same filters, so those filters
  should live in one place per feature rather than being repeated per query.
- Restoring a task or un-archiving a project is a normal update, not a restore
  from backup.
- Unique constraints and soft delete conflict: a unique column on a soft-deleted
  row still occupies its value. Nothing in the M3 schema has that combination,
  but if one is added later (for example a unique task title per project) the
  constraint has to exclude deleted rows with a partial index.
- A genuine erasure request (GDPR-style) has no path yet. It will need a
  separate, deliberate hard-delete operation rather than reusing these fields.
