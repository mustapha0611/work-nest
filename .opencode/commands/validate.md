---
description: Run the WorkNest validation commands and report terminal evidence
agent: validator
subagent: true
---

Validate the change described below. Run every command in
`.opencode/skills/orchestration/SKILL.md` → "Validation commands", in that order.

Stop at the first failure and report its full output. A command that does not exist yet is a SKIP
with a reason, never a PASS. Include a Terminal Evidence section with the actual stdout/stderr and
exit code for every command you report.

Do not modify any file, install anything, or run a migration.

## Scope

$ARGUMENTS
