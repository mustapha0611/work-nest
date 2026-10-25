---
name: frontend-feature
description: Implement a WorkNest Angular feature using feature-based folders, dedicated API services, accessible UI states, and a teaching-first workflow.
---

# Frontend Feature Workflow

1. Read `AGENTS.md`, `PROJECT_BRIEF.md`, design-system docs, and the existing feature conventions.
2. Inspect the existing feature before editing. Follow the established Angular version and style.
3. Explain the concept, the UI/data flow, and the intended files before implementation.
4. Organize by feature. Keep feature-specific API services in that feature's `services/` folder; reserve `core/` for app-wide services and `shared/` for reusable UI/utilities.
5. Keep page components focused on UI orchestration. Put HTTP calls in injected services, define explicit types, and avoid duplicate API logic.
6. Use standalone APIs and modern Angular control flow (`@if`, `@for`) where applicable.
7. Reuse design tokens and shared components. Do not invent parallel button/input/dialog patterns.
8. Consider loading, empty, error, success, disabled, focus, keyboard, and responsive states.
9. Add or update relevant tests; run checks where possible and report actual results.
10. Explain changed files and important code, then ask 2–4 understanding questions or give a small exercise.
