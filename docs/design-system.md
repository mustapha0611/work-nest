# WorkNest Design System

## Status

Initial proposal. Agree on the visual direction and styling/UI approach before implementing the complete UI.

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
