---
schema: keel.sprint/1
sprint: 12
goal: Conversion landing (issue #4, benchmark D3/D9) + provisional legal pages
status: done
slices:
  - id: S-059
    title: landing copy + legal copy in src/config/copy (no invented figures, mandatory-copy rules)
    status: done
    hours: 1
    depends_on: []
    criteria: [AC-4-nofiller, AC-4-copy]
  - id: S-060
    title: rebuild src/app/page.tsx — hero, how-it-works, categories, no-need-to-know, advantages, contrast block, trust block, data protection, visual quote example, insurance block, coverage, FAQ, urgency, footer
    status: done
    hours: 3
    depends_on: [S-059]
    criteria: [AC-4-onescreen, AC-4-cta, AC-4-nofiller, AC-4-design]
  - id: S-061
    title: /legal/privacidad + /legal/aviso-legal (provisional, marked pending review — issue #17); footer + consent-step links
    status: done
    hours: 1
    depends_on: [S-059]
    criteria: [AC-4-cta]
  - id: S-062
    title: OG/SEO metadata for / ; browser drive at desktop + structure check for mobile
    status: done
    hours: 0.5
    depends_on: [S-060]
    criteria: [AC-4-seo, AC-4-onescreen, AC-4-cwv]
---

# Sprint 12 — Conversion landing (issue #4, D3/D9)

## Acceptance criteria (issue #4)
- [ ] AC-4-onescreen — within one mobile screen the service is understood and a CTA is visible.
- [ ] AC-4-cta — every CTA lands at the right step of the flow (`/solicitar`, `/solicitar?seguro=1`,
  `/legal/*`).
- [ ] AC-4-nofiller — no filler sections, no invented figures/reviews/years/guarantees.
- [ ] AC-4-cwv — Core Web Vitals sane (static page, `next/font` already, no heavy client JS).
- [ ] AC-4-seo — social + basic SEO metadata (OG, description, canonical).
- [ ] AC-4-design — differentiated, consistent with the `src/ui` design system.

## Binding refinements (docs/02-functional-spec.md — "Landing (#4)" + D3 + D9)
- Visible contrast with (a) the traditional local web and (b) the marketplace. Recommended message:
  *"No buscamos cuatro profesionales para que te llamen. Entendemos el problema, seleccionamos la
  solución adecuada y te acompañamos hasta que quede resuelto."*
- D3: the request is NEVER distributed to multiple professionals — an explicit, verifiable promise.
- "Por qué puedes confiar" block (ties to #21); data-protection explanation; a visual quote example
  (scope, total, timeframe, warranty); real company/team identity ONLY when available (none invented);
  a differentiated urgency CTA WITHOUT a 24/7 promise; insurance copy always "podría estar cubierto",
  never "no pagarás".
- Mandatory-copy rules: no definitive diagnosis, no guaranteed coverage, no universal free service,
  no automatic professional response.

## Slices
S-059 → S-060 → S-061 → S-062. Copy is centralised (D-006); the page is static RSC + `src/ui`
primitives + a `page.module.css`.

## Close-out (2026-08-30)

- **Acceptance criteria:**
  - [x] AC-4-onescreen — the hero is compact: kicker + tagline (≤16ch title) + a two-line lead +
    the two CTAs + the response-time disclaimer, nothing else above the fold. On a 360×640 mobile
    both CTAs sit within the first screen. (The Claude-in-Chrome window resize did not reflect in
    screenshots this session, so this is a structure/CSS check, not a device screenshot — recorded
    as such.)
  - [x] AC-4-cta — every CTA is a plain `<a href>` to a real route: "Solucionar un problema" →
    `/solicitar` (×3), "Comprobar mi seguro" → `/solicitar?seguro=1` (×2), footer + data-protection
    → `/legal/privacidad` / `/legal/aviso-legal`. All verified 200 and present in the rendered HTML.
  - [x] AC-4-nofiller — no invented figures, reviews, years or guarantees. The trust block says so
    explicitly ("aquí no verás cifras, años de experiencia ni reseñas inventadas"); the quote
    example is labelled "Ejemplo ilustrativo"; team/company identity is described as "en la revisión
    jurídica" rather than fabricated.
  - [x] AC-4-cwv — `/` and `/legal/*` build as static (`○` prerendered); `next/font` (Nunito,
    `display: swap`) already set up; zero client JS on the landing (FAQ uses native `<details>`).
  - [x] AC-4-seo — `metadata` export: title, description, `alternates.canonical`, `openGraph`
    (title/description/type/locale/siteName), `twitter` card. Root layout supplies `metadataBase`
    and the title template. Legal pages are `robots: { index: false }`.
  - [x] AC-4-design — `src/ui` primitives (`ButtonLink`, `Card`, `Icon`, `TRADE_ICONS`) + design
    tokens throughout `page.module.css`; brand-soft callouts, the warm palette, a scannable rhythm.
    Browser-checked on desktop (dark theme via system preference): consistent with `/solicitar` and
    the admin.
- **Sections built:** hero · cómo funciona (4 steps) · 11 visual service categories + "lo
  averiguamos nosotros" · "No necesitas saber qué profesional necesitas" · "Qué hacemos distinto"
  (5, incl. "Un solo interlocutor" = **D3**) · **contrast table** web tradicional / marketplace /
  Praetoria + the recommended message (**D9**) · "Por qué puedes confiar" (**D9**, → #21) ·
  "Qué hacemos con tus datos" (**D9**) · **visual quote example** with scope/total(159,72 €)/plazo/
  garantía + "Ejemplo ilustrativo" (**D9**) · insurance block ("podría estar cubierto", "nunca…
  'no pagarás'") · coverage from `src/config/coverage.ts` · realistic FAQ (incl. "¿24/7?" → no) ·
  urgency block (112, no 24/7 promise) · footer with legal links.
- **Legal pages:** `/legal/privacidad` + `/legal/aviso-legal` — a shared `LegalDoc` renderer, every
  page carries the provisional-pending-review banner (issue #17), `noindex`. Footer links them; the
  assistant consent step already linked `/legal/privacidad` (now a real page).
- **Mandatory-copy rules:** no definitive diagnosis, no guaranteed coverage, no universal free
  service ("pedir presupuesto y el análisis inicial no tienen coste" — precise, not "gratis"), no
  automatic professional response — all honoured, all copy in `src/config/copy` (D-006).
- **Verification (TP-13):** lint / typecheck / `npx next build` clean; 162 tests still green (no
  new tests — the landing is static markup, and `references/test-automation.md`'s not-applied list
  covers markup). Browser drive: full landing render (all sections + copy verified via page text),
  `/legal/privacidad` render with the banner, all CTA hrefs correct and 200.
- **Lessons:** none. Note: Claude-in-Chrome `resize_window` did not change the screenshot viewport
  this session — mobile layout was checked by reading the CSS (single-column grids below 40rem,
  compact hero) rather than a device screenshot.
