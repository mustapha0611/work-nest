# WorkNest Design System

## Status

M4. The token layer lives in `frontend/src/styles/tokens.css`, and the first three primitives live in
`frontend/src/app/shared/ui/`:

- `button[wn-button]` — primary, secondary, ghost and danger actions.
- `span[wn-badge]` — short status labels.
- `wn-text-field` — a labelled input that works with Angular reactive forms.

The login screen, the signed-in placeholder and the diagnostics page compose these primitives. New
primitives are added when a milestone needs them, not up front.

## Principles

- Clear, calm, professional SaaS dashboard.
- Consistent spacing, typography, colors, and component behavior.
- Responsive from mobile through desktop.
- Accessible semantic HTML, labels, keyboard support, visible focus, and sufficient contrast.
- Reuse existing tokens/components rather than introducing one-off styles.

## Token groups

All are implemented in `tokens.css` as CSS custom properties:

- Color: brand, text, muted text, surface, background, border, success, warning, danger, info.
- Typography: font family, heading scale, body, labels, helper text.
- Spacing: a 4px-based scale.
- Shape: border widths and radii.
- Elevation: three shadow levels.
- Motion: two durations and one easing curve.
- Breakpoints: documented values; media queries must use literals because CSS cannot read custom
  properties inside `@media`.

Components use **semantic** tokens (`--wn-color-primary`, `--wn-space-4`) and never primitive ones
(`--wn-teal-700`). A rebrand or dark theme should be a change to `tokens.css`, not a search across
components.

## Components

### Button

Attribute selector so the native `<button>` keeps form submission, `disabled`, keyboard activation and
screen-reader semantics.

```html
<button wn-button>Save</button>
<button wn-button variant="secondary" (click)="cancel()">Cancel</button>
<button wn-button variant="danger" [disabled]="deleting()">Delete</button>
```

- Variants: `primary` (one per region), `secondary`, `ghost` (dense UI), `danger` (always paired with
  confirmation).
- Sizes: `md` (default), `sm`.
- Disabled state is native; loading state is the consumer's responsibility (disable + change label).

### Badge

Tones: `neutral`, `info`, `success`, `warning`, `danger`. The label text always carries the meaning;
tone is reinforcement, never the only signal.

```html
<span wn-badge tone="success">API online</span>
```

### Text field

Wraps a native input with a generated id, label association, hint, error message and
`aria-describedby` wiring. It implements `ControlValueAccessor`, so `formControlName` and
`[(ngModel)]` work directly.

| Input          | Type                        | Default | Purpose                                             |
| -------------- | --------------------------- | ------- | --------------------------------------------------- |
| `label`        | `string` (required)         | —       | Visible label, associated via `for`/`id`.           |
| `type`         | `text \| email \| password` | `text`  | Native input type.                                  |
| `autocomplete` | `string`                    | `off`   | Password-manager and browser autofill hint.         |
| `hint`         | `string \| null`            | `null`  | Helper text, also referenced by `aria-describedby`. |
| `error`        | `string \| null`            | `null`  | Error text; sets `aria-invalid` and `role="alert"`. |
| `required`     | `boolean`                   | `false` | Adds a visual asterisk and `aria-required`.         |

```html
<wn-text-field
  formControlName="email"
  label="Email"
  type="email"
  autocomplete="username"
  [required]="true"
  [error]="emailError()"
/>
```

Rules:

- The consumer decides **when** an error is shown (for example after blur or submit) and passes the
  message in. The field owns the markup, not the validation policy.
- Errors are announced with `role="alert"`; do not duplicate the same message in a separate live
  region.
- Do not set the native `required` attribute as well: it triggers browser validation bubbles that
  bypass the inline error pattern.
- The password field does not implement a show/hide toggle yet. If one is added, it needs its own
  accessible name and `aria-pressed` state.

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
- Product-specific compositions: `frontend/src/app/features/<feature>/`.
- App-wide state and HTTP boundaries: `frontend/src/app/core/`.
