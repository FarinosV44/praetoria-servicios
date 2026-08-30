---
schema: keel.sprint/1
sprint: 11
goal: Coverage analysis + reviewable legal draft (issue #15, benchmark D5)
status: done
slices:
  - id: S-055
    title: coverage domain — clause/norm/assessment split, prudent draft builder, disclaimers, needs-document (pure, test-first)
    status: done
    hours: 2
    depends_on: []
    criteria: [AC-15-pageref, AC-15-draftparts, AC-15-limits]
  - id: S-056
    title: coverageService — analyze (AI + validate), draft, markReviewed, reviseDraft, history
    status: done
    hours: 2
    depends_on: [S-055]
    criteria: [AC-15-pageref, AC-15-needdoc, AC-15-humanreview]
  - id: S-057
    title: admin coverage panel — run, verdict + references, draft (labelled), mark reviewed, revision history
    status: done
    hours: 2
    depends_on: [S-056]
    criteria: [AC-15-humanreview, AC-15-limits]
  - id: S-058
    title: /s/[token] coverage view — prudent verdict + process explanation; reviewed draft only when reviewed
    status: done
    hours: 1
    depends_on: [S-056]
    criteria: [AC-15-limits]
---

# Sprint 11 — Coverage analysis + legal draft (issue #15, D5)

## Acceptance criteria (issue #15)
- [ ] AC-15-pageref — every relevant contractual assertion carries a page reference
  (`coverageResultSchema.references` = `{ document, page, quote }`).
- [ ] AC-15-needdoc — if the applicable condition is missing, the system asks for the document
  (`INFORMACION_INSUFICIENTE` / missing clause → a prompt to upload).
- [ ] AC-15-draftparts — the draft includes hechos, petición, fundamento contractual and anexos.
- [ ] AC-15-limits — clear warnings about the limits of the analysis (never promises coverage;
  explains perito → tercer perito → Defensor del Asegurado → DGSFP; "falta de mantenimiento" pattern).
- [ ] AC-15-humanreview — the human review is recorded (`CoverageAnalysis.draftStatus`
  BORRADOR_PENDIENTE_REVISION → REVISADO_PRAETORIA, `reviewedByAdminId`, `reviewedAt`,
  `CoverageDraftRevision` history).

## Design notes (benchmark D5)
- `CoverageAnalysis` / `CoverageDraftRevision` models and `coverageResultSchema`
  (`pageReferenceSchema` with `document`/`page`/`quote`) already exist — **no migration**.
- `adapters.ai.analyzeCoverage({ analysis, problemText, policyPages })` mock exists.
- `policyPages` come from re-running OCR over the insurance documents (`insuranceService` exposes a
  `getPolicyPages(requestId)` helper — deterministic mock OCR).
- D5: always separate *cláusula de póliza · norma legal · valoración*; never invent articles or use
  generic laws when the conclusion depends on the contract; 4-state verdict; the draft stays
  "borrador pendiente de revisión" until an admin explicitly marks it reviewed.

## Slices
S-055 → S-056 → S-057 → S-058. Pure logic (draft builder, clause/norm split, needs-document,
disclaimers) is test-first per D-007.

## Close-out (2026-08-30)

- **Acceptance criteria:**
  - [x] AC-15-pageref — `coverageResultSchema.references` = `{ document, page, quote }`;
    `buildCoverageBreakdown` keeps them on the policy clause; `buildDraft` prints them in the
    FUNDAMENTO CONTRACTUAL section. Browser (admin + client): "Condiciones particulares, pág. 1: …".
  - [x] AC-15-needdoc — `needsPolicyDocument` is true for `INFORMACION_INSUFICIENTE` or a missing
    clause with no references; admin panel and client view both show "falta la condición aplicable /
    súbelo". Integration test "asks for the document when there is no policy text".
  - [x] AC-15-draftparts — `buildDraft` always emits HECHOS, PETICIÓN, FUNDAMENTO CONTRACTUAL,
    ANEXOS (default anexos when none recommended). Domain test asserts all four.
  - [x] AC-15-limits — the D5 three-way split (`cláusula de póliza · norma / proceso · valoración`);
    `legalNorm.process` is the real route (perito → tercer perito → Defensor del Asegurado → DGSFP →
    vía judicial), never an invented article (test asserts no `artículo \d+`); `STANDARD_CAVEATS`
    carries "no garantiza la cobertura", "no se citan artículos concretos", and the
    "falta de mantenimiento" pattern. All shown on both surfaces.
  - [x] AC-15-humanreview — `CoverageAnalysis.draftStatus` BORRADOR_PENDIENTE_REVISION →
    REVISADO_PRAETORIA only via `markReviewed` (records `reviewedByAdminId` + `reviewedAt` + a
    `CoverageDraftRevision`); an edit (`reviseDraft`) keeps the prior text as a revision; a re-run
    (`analyze`) resets the review state. Browser: "Marcar como revisado por Praetoria" → header
    flips to "Revisado por Praetoria", button disappears, "Historial de revisiones (1)" appears;
    the CLIENT view showed "Estamos preparando un borrador…" before the review and the full draft
    (labelled "revisado por Praetoria") after it.
- **Never promise coverage / a result:** every caveat, the draft footer, and the client copy repeat
  it; the AI mock's verdicts are the four D5 states only.
- **Verification (TP-12):** 11 pure + 6 integration tests (162 total green); lint/typecheck/build
  clean. Browser drive on `localhost:3126`: admin panel (D5 split + page refs + generated draft +
  mark-reviewed + revision history) and the `/s/[token]` client view before/after review.
- **Lessons:** none failed. Admin login via Claude-in-Chrome was flaky this session (the `type`
  action intermittently didn't land text; `form_input` + clicking the submit button by coordinate
  worked) — a test-harness quirk, not a product issue; noted so the next session batches
  `form_input` + a coordinate click rather than `type` + Enter.
