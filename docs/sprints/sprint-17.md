---
schema: keel.sprint/1
sprint: 17
goal: Carta de Confianza Praetoria + transparencia antes de contratar (issue #21)
status: done
slices:
  - id: S-095
    title: "src/config/trust-charter.ts — versioned charter, every commitment backed by a real function (test-first)"
    status: done
    hours: 1.5
    depends_on: []
    criteria: [AC-21-real, AC-21-version]
  - id: S-096
    title: "/confianza page — full charter, version + effective date, Praetoria-provides vs professional-executes, 'Gestionado por Praetoria' seal (not a certification); sitemap/robots/footer"
    status: done
    hours: 1.5
    depends_on: [S-095]
    criteria: [S-21-split, AC-21-readable]
  - id: S-097
    title: "landing — replace the trust block with the charter summary + seal + link to /confianza"
    status: done
    hours: 0.5
    depends_on: [S-095]
    criteria: [AC-21-readable]
  - id: S-098
    title: "/s/[token] — pre-acceptance costs + relevant commitments next to the accept button; record charterVersion on the decision evidence"
    status: done
    hours: 1
    depends_on: [S-095]
    criteria: [AC-21-costs, AC-21-bound]
  - id: S-099
    title: "a11y — underline in-text links (link-in-text-block); /confianza added to the axe pass"
    status: done
    hours: 0.5
    depends_on: [S-096, S-097, S-098]
    criteria: [AC-21-readable]
  - id: S-100
    title: "verify — tests, build, E2E (smoke + axe for /confianza)"
    status: done
    hours: 0.5
    depends_on: [S-095, S-096, S-097, S-098, S-099]
    criteria: [AC-21-real, AC-21-version, AC-21-costs, AC-21-bound, AC-21-readable]
---

# Sprint 17 — Carta de Confianza + transparencia (issue #21)

## Acceptance criteria (issue #21)
- [x] AC-21-real — every commercial promise maps to a real function/process:
  `src/config/trust-charter.ts` — each `commitment` carries a `backing` string naming the
  operational reality; `trust-charter.test.ts` asserts none is empty.
- [x] AC-21-costs — potential costs appear before acceptance: `TRUST_CHARTER.preAcceptanceCosts`
  (visit fee + discount, taxes/desplazamiento included, extras approved in writing) is shown on
  `/s/[token]` in an "Antes de aceptar" block **above** the accept button, and on `/confianza`.
- [x] S-21-split — "qué presta Praetoria" vs "qué ejecuta el profesional" is an explicit two-column
  section on `/confianza`.
- [x] AC-21-readable — the charter is short (summary ≤ 7 lines on the landing; full page is a plain
  list, "se lee en menos de dos minutos"); in-text links are underlined (a11y). axe: 0 serious/
  critical on `/confianza` (both viewports).
- [x] AC-21-version — `version` + `effectiveDate` shown on the page; `trust-charter.test.ts` pins
  the format.
- [x] AC-21-bound — on quote acceptance, `clientLinkService.decideQuote` records
  `charterVersion: TRUST_CHARTER.version` on `Quote.decisionEvidence` — a later charter change
  never alters an already-accepted request. `clientLink.test.ts` asserts it.
- Seal: "Gestionado por Praetoria" with an explicit note that it is not an external certification.
  No figures, no invented testimonials (same rule as #4/#28).

## What was built
- **`src/config/trust-charter.ts`** (+6 tests, test-first) — `TRUST_CHARTER` (version 1.0,
  effectiveDate 2026-08-31): 10 backed commitments, `summary`, `praetoriaProvides` /
  `professionalExecutes`, `preAcceptanceCosts`, `sealNote`; `commitmentsAtAcceptance()`.
- **`src/app/confianza/page.tsx`** + `confianza.module.css` — full charter, versioned, seal, split,
  costs block, the "future versions only" note. `generateMetadata` + canonical. Added to
  `sitemap.ts`, `robots.ts` allow, the landing footer.
- **Landing** (`src/app/page.tsx`) — the trust section now renders `TRUST_CHARTER.summary` + the seal
  + a link to `/confianza`.
- **`/s/[token]`** (`ClientStatusView.tsx`) — "Antes de aceptar" block (costs + `atAcceptance`
  commitments + charter version) before the decision buttons.
- **`clientLink.ts`** — `charterVersion` on the decision evidence.
- **a11y** — `.note a` / in-text links underlined (`link-in-text-block`); `/confianza` in the axe pass.

## Verification (TP-18)
243 vitest (+6); lint / typecheck / `npx next build` clean. 33 E2E pass (desktop + mobile; 3 mobile
admin-panel tests skipped) — new: `/confianza` smoke + axe (both viewports), 0 serious/critical.

## Close-out
`develop` → `main` merge (user-authorised per sprint, `--no-ff`, push). Beat-1 comment on #21.
