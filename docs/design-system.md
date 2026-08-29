# Design system — Praetoria Servicios (issue #3)

Founding, in-code design system. No external design tool (D-005). Live catalogue at `/estilo`
(not indexed).

## Personality

Cercana, resolutiva, limpia y profesional. Transmite **rapidez, alivio y confianza** — no un
directorio genérico de reparaciones. Emotional arc: *problema/preocupación → análisis/movimiento →
solución/alivio*, carried by the mascot.

## Tokens — `src/ui/tokens.css`

CSS custom properties on `:root`, with a `prefers-color-scheme: dark` block and a
`prefers-reduced-motion` block that zeroes the motion tokens. Never hardcode a colour outside this
file.

| Group | Tokens |
|---|---|
| Colour — neutrals | `--c-bg`, `--c-surface`, `--c-surface-sunken`, `--c-border`, `--c-border-strong`, `--c-text`, `--c-text-soft`, `--c-text-faint` |
| Colour — brand (terracota) | `--c-brand`, `--c-brand-hover`, `--c-brand-active`, `--c-brand-soft`, `--c-on-brand` |
| Colour — accent (teal) | `--c-accent`, `--c-accent-soft` |
| Feedback | `--c-success`, `--c-warning`, `--c-danger`, `--c-info` (+ `-soft` each) |
| Emotional | `--c-state-worry`, `--c-state-progress`, `--c-state-relief` |
| Type | `--font-sans` (Nunito), `--font-mono`; `--text-xs … --text-4xl`; `--leading-*`; `--weight-*` |
| Space | `--space-1 … --space-12` (4px base) |
| Radius | `--radius-sm … --radius-xl`, `--radius-full` |
| Shadow | `--shadow-sm/md/lg` (warm-tinted) |
| Motion | `--motion-fast/base/slow`, `--ease-out` (zeroed under reduced-motion) |
| Layout | `--page-max`, `--prose-max`, `--touch-min` (44px) |

Font: **Nunito** via `next/font` (self-hosting + `display: swap` → no layout shift, satisfies
"no hay saltos de layout al cargar iconos o fuentes").

## Components — `src/ui/`

| Component | File | Notes |
|---|---|---|
| `Button` / `ButtonLink` | `primitives/Button.tsx` | variants: primary/secondary/ghost/danger; sizes md/lg; `loading` (aria-busy); min 44px |
| `Field` | `primitives/Field.tsx` | label + hint + error, `aria-invalid`/`aria-describedby`, `as="textarea"` |
| `Card` | `primitives/Card.tsx` | `interactive` variant |
| `Alert` | `primitives/Alert.tsx` | tones info/success/warning/danger; `role=alert` for warning/danger |
| `Spinner` | `primitives/Spinner.tsx` | `role=status` + SR-only label |
| `EmptyState` | `primitives/EmptyState.tsx` | title + description + action |
| `Stepper` | `primitives/Stepper.tsx` | real position, never a faked % ; `aria-label` nav + "Paso X de N" |
| `Modal` | `primitives/Modal.tsx` | focus trap, Escape, restores focus, `aria-modal`, backdrop close, body scroll lock |
| `Icon` | `icons/Icon.tsx` | inline SVG registry (no external load), 24×24, `currentColor`; 12 trade + 8 state icons |
| `Mascot` | `mascot/Mascot.tsx` | moods worry/progress/relief/neutral; gentle breathing animation (off under reduced-motion) |
| `SafetyAlert` | `patterns/SafetyAlert.tsx` | benchmark D2 — high-contrast, triage instructions + 112 |
| `IntentCards` | `patterns/IntentCards.tsx` | benchmark D1 — 3 intent entries, not a trade grid |
| `Uploader` | `patterns/Uploader.tsx` | shell: dropzone + per-file preview/progress/retry/remove/reorder; issue #6 wires the machinery |

## Accessibility (issue #3 criteria)

- Contrast: WCAG AA against the token palette (verified in Phase 6 / issue #19 automated pass).
- Full keyboard navigation; visible focus ring (`:focus-visible`, 3px `--c-focus-ring`).
- Scales 320px → desktop (relative units, flex/grid).
- Animations brief, non-blocking, and disabled via `prefers-reduced-motion` (both token-level and a
  global CSS safety net in `globals.css`).
- Skip link to `#contenido` in the root layout.

## Reuse

Landing (#4), assistant (#5) and admin (#11) all consume `src/ui`. New screens compose these; a new
primitive is added here (with its catalogue entry) rather than inline in a screen.
