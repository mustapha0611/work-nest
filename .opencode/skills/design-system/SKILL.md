---
name: design-system
description: Create and evolve WorkNest design tokens and reusable accessible Angular UI components consistently.
---

# Design System Workflow

1. Inspect existing global styles, tokens, shared UI components, and `docs/design-system.md` before proposing changes.
2. Explain the visual/interaction goal and identify which existing token or component should be reused.
3. Keep tokens centralized for color, typography, spacing, radii, borders, shadows, and breakpoints. Avoid unexplained one-off values.
4. Place generic reusable primitives in `app/shared/ui/`; keep product-specific compositions in their feature folders.
5. Define clear component inputs/outputs, variants, disabled/loading states, keyboard behavior, focus styles, labels, and accessible semantics.
6. Check responsive behavior and color contrast where relevant. Prefer semantic HTML and avoid relying on color alone to communicate status.
7. Build only components needed by the current milestone. Do not create a large speculative component library.
8. Update `docs/design-system.md` with tokens, variants, examples, and usage rules.
9. Run available checks and report what was actually verified.
10. Explain the component API and ask the developer to make a small variant or token change as a learning exercise.
