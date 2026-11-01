# WorkNest Design System

## Status

In progress (M2). The token layer is implemented in `frontend/src/styles/tokens.css`, and the first
two primitives — button and badge — live in `frontend/src/app/shared/ui/`. The application shell and
the remaining primitives are built as later milestones need them.

## Principles

- Clear, calm, professional SaaS dashboard.
- Consistent spacing, typography, colors, and component behavior.
- Responsive from mobile through desktop.
- Accessible semantic HTML, labels, keyboard support, visible focus, and sufficient contrast.
- Reuse existing tokens/components rather than introducing one-off styles.

## Planned token groups

- Color: brand, text, muted text, surface, background, border, success, warning, danger, info.
- Typography: font family, heading scale, body, labels, helper text.
- Spacing: a consistent spacing scale.
- Shape: border widths and radii.
- Elevation: shadows where needed.
- Motion: durations and easing.
- Breakpoints: responsive layout thresholds.

## Initial reusable components

Build only as needed: button, text field, select, checkbox, badge, avatar, dialog, toast/notification, loading indicator, empty state, error state, data table, pagination, sidebar, and topbar.

## Component checklist

- Clear purpose and API.
- Consistent variants and sizes.
- Loading/disabled states where applicable.
- Keyboard interaction and visible focus.
- Accessible names and semantic markup.
- Responsive behavior.
- Examples/usage guidance for non-obvious components.

## File convention

- Tokens/global styles: `frontend/src/styles/`.
- Generic reusable UI: `frontend/src/app/shared/ui/`.
- Product-specific compositions: the relevant `features/<feature>/` folder.
