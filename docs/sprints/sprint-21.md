---
schema: keel.sprint/1
sprint: 21
goal: Verified reviews + local reputation — capture, honest averages, moderation without cherry-picking, PII scrubbing, negative→incidence (issue #26)
status: done
slices:
  - id: S-122
    title: "domain: reputation/aggregate.ts (reproducible averages + distribution + dimension means), reputation/pii.ts (detect+redact), reputation/moderation.ts (state machine + no-cherry-pick guard), reputation/spam.ts (dup/spam) — all test-first"
    status: done
    hours: 2.5
    depends_on: []
    criteria: [AC-26-averages, AC-26-pii, AC-26-cherrypick]
  - id: S-123
    title: "schema: Review extensions (dimensions, professionalId, moderationReason/By/At, praetoriaResponse, withdrawnAt/reason, publishedAt) + ReviewStatus RETENIDA_PII + migration"
    status: done
    hours: 1
    depends_on: [S-122]
    criteria: [AC-26-consent]
  - id: S-124
    title: "reviewService: submit (dimensions + auto-hold on PII + dup check), moderate (reason required, PII gate), applyRedaction, respond, withdraw, openIncidence, aggregateFor, listPublished(filter/sort, never by rating) — integration tests"
    status: done
    hours: 2
    depends_on: [S-123]
    criteria: [AC-26-nojob, AC-26-averages, AC-26-pii, AC-26-negative, AC-26-consent, AC-26-nodemo]
  - id: S-125
    title: "public: ReviewsSection (date + service type, transparent sort/filter, 'qué significa verificada', GBP link) on /servicios/[slug] + indexable /zonas/[municipio]; AggregateRating+Review JSON-LD only when real reviews exist"
    status: done
    hours: 2
    depends_on: [S-124]
    criteria: [AC-26-averages, AC-26-nodemo]
  - id: S-126
    title: "admin /admin/opiniones: moderation queue (pendiente/retenida-PII/rechazada), reason + audit, redaction editor, respond, withdraw, 'abrir incidencia'; /s/[token] PostService review form gets optional dimensions"
    status: done
    hours: 2
    depends_on: [S-124]
    criteria: [AC-26-cherrypick, AC-26-pii, AC-26-negative, AC-26-consent]
  - id: S-127
    title: "verify — tests, build, HTTP checks, E2E; sprint close"
    status: done
    hours: 1
    depends_on: [S-122, S-123, S-124, S-125, S-126]
    criteria: [AC-26-nojob, AC-26-averages, AC-26-cherrypick, AC-26-pii, AC-26-negative, AC-26-consent, AC-26-nodemo]
---

# Sprint 21 — Verified reviews + local reputation (issue #26)

## Acceptance criteria (issue #26)
- [x] AC-26-nojob — a review cannot be submitted for a non-existent (or non-CERRADA) job.
- [x] AC-26-averages — averages are reproducible and tested; computed only from real published reviews.
- [x] AC-26-cherrypick — moderation cannot select only positive reviews (publish is per-review, no rating filter hides legitimate criticism).
- [x] AC-26-pii — PII (phones, emails, addresses) is detected and removed before publication.
- [x] AC-26-negative — a negative review can open an incidence.
- [x] AC-26-consent — publication consent and withdrawal are traced (audit log + timestamps).
- [x] AC-26-nodemo — zero fictitious reviews or demo data; nothing renders unless it is a real authorised consented review of a CERRADA request.

## Design
- Builds on the #23 seed (`Review` model, `reviewService.submit/authorize/listPublished`). The unique
  per-request/client link already exists — it is the signed `/s/[token]` client link; the review form
  lives in `PostService.tsx`.
- **Honest "verificada"**: a badge/explainer that says exactly what it means — *trabajo gestionado y
  cerrado por Praetoria* — never a generic trust claim. `seo.ts` already forbids invented ratings.
- **No cherry-picking**: publication is a per-review admin decision with a recorded reason for every
  non-publish outcome. `listPublished` never accepts a rating filter. A 1-star review reaches
  AUTORIZADA by the same path as a 5-star one (asserted in tests).
- **PII**: `detectPii` runs at submit → a hit auto-sets `RETENIDA_PII` (not PENDIENTE). Admin redacts
  (`applyRedaction`) and only then can move to AUTORIZADA; `moderate` refuses AUTORIZADA while an
  unredacted PII flag stands.
- **Averages**: `computeAggregate` is pure — `{ count, average (half-up, 1 dp), distribution[1..5],
  dimensionAverages }`. Returns `count: 0` and `average: null` when there is nothing real → callers
  render no rating and emit no `AggregateRating` JSON-LD.
- **Negative → incidence**: `reviewService.openIncidence(reviewId)` delegates to
  `serviceClosureService.openIncidence` with `openedBy: "ADMIN"`.
