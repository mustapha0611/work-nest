---
description: Plan a WorkNest change without editing files
agent: plan
subagent: false
---

You are in planning mode for WorkNest.

Read `AGENTS.md`, `PROJECT_BRIEF.md`, `docs/architecture.md`, and
`.opencode/skills/orchestration/SKILL.md` first. Then:

1. Inspect the relevant code and existing conventions. Do not assume the layout.
2. Restate the goal and ask only blocking questions.
3. Present: concept, plan, files to create/modify, trade-offs, risks, and iron rules that apply.
4. Break the work into phases with acceptance criteria and validation commands.
5. Present Now / Next / Later for scalability where relevant.
6. End with a clean final plan and tell the user to run `/build`.

Do not modify, create, or delete source files. Do not create the spec structure; `/build` does that.

## Request

$ARGUMENTS
