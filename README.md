# WorkNest OpenCode Starter Instructions

This folder contains planning and agent-instruction files for building WorkNest. It is **not** the generated Angular/Express application itself.

## Files
- `AGENTS.md` — persistent project-wide engineering, teaching, architecture, design-system, security, testing, and scalability rules.
- `PROJECT_BRIEF.md` — product scope, stack, architecture direction, milestones, and definition of done.
- `BOOTSTRAP_PROMPT.md` — first prompt to give OpenCode before scaffolding.
- `.opencode/skills/*/SKILL.md` — focused workflows for recurring tasks.
- `docs/` — architecture and convention templates to maintain as the project grows.

## How to use
1. Copy these files into the root of your WorkNest repository, preserving `.opencode/skills/` and `docs/`.
2. Open the repository root in OpenCode.
3. Paste the content of `BOOTSTRAP_PROMPT.md` into OpenCode.
4. Review the proposed repository inspection and setup plan. Approve the decisions you agree with before letting it install or scaffold anything.
5. Implement one milestone at a time and keep these documents updated.

## Important
- The target folder structure is a convention, not a demand to create every directory on day one.
- Check current official docs and installed versions before running setup commands.
- Do not commit `.env` or real credentials. Keep `.env.example` limited to placeholders.
