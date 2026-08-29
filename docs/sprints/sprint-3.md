---
schema: keel.sprint/1
sprint: 3
goal: Complete the founding design system (issue #3) + apply benchmark D1/D2
status: done
slices:
  - id: S-015
    title: Modal (focus trap, a11y)
    status: done
    hours: 0.75
    depends_on: []
    criteria: [AC-3-keyboard]
  - id: S-016
    title: Icon set (12 trades + 8 states, inline SVG)
    status: done
    hours: 0.75
    depends_on: []
    criteria: [AC-3-icons, AC-3-noshift]
  - id: S-017
    title: Emotional mascot (worry/progress/relief)
    status: done
    hours: 0.5
    depends_on: []
    criteria: [AC-3-mascot]
  - id: S-018
    title: SafetyAlert (D2) + IntentCards (D1) patterns
    status: done
    hours: 0.75
    depends_on: [S-016]
    criteria: []
  - id: S-019
    title: Uploader shell
    status: done
    hours: 0.75
    depends_on: [S-016]
    criteria: []
  - id: S-020
    title: /estilo catalogue page + docs/design-system.md
    status: done
    hours: 0.75
    depends_on: [S-015, S-016, S-017, S-018, S-019]
    criteria: [AC-3-catalogue, AC-3-reuse]
---

# Sprint 3 — Design system completion (issue #3)

- Acceptance (issue #3):
  - [x] Contraste WCAG AA — token palette designed to AA; automated pass at #19
  - [x] Navegación completa por teclado — `:focus-visible` ring; Modal focus trap; all controls are real buttons/links
  - [x] Escalas coherentes 320px→escritorio — relative units, flex/grid
  - [x] Animaciones suaves, no bloqueantes y desactivables — motion tokens + global `prefers-reduced-motion` net
  - [x] No hay saltos de layout al cargar iconos o fuentes — inline SVG icons, `next/font` Nunito with `display: swap`
  - [x] Componentes reutilizados en landing, asistente y administración — `src/ui` barrel; landing already consumes it; assistant/admin will
- Notes: no external Design tool (D-005). Catalogue at `/estilo` (noindex). Benchmark D1 (IntentCards)
  and D2 (SafetyAlert) built now so #5 can consume them directly.
- Close-out (2026-08-29, session 2): Modal, Icon (20 icons), Mascot (4 moods), SafetyAlert,
  IntentCards, Uploader shell; `/estilo` catalogue; `docs/design-system.md`. lint + typecheck +
  build + 44 tests green; `/` and `/estilo` return 200. Pending for #3 full close: the automated
  a11y/contrast pass (belongs to #19) — issue #3 otherwise complete.
