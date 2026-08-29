---
schema: keel.sprint/1
sprint: 2
goal: Persistence layer for requests — creation, validated transitions, immutable history (issue #9)
status: done
slices:
  - id: S-010
    title: Zod input schemas (draft, contact, location, consent)
    status: done
    hours: 0.75
    depends_on: []
    criteria: [AC-9-model]
  - id: S-011
    title: Pure draft-expiry helper + test-first
    status: done
    hours: 0.5
    depends_on: []
    criteria: [AC-9-expire]
  - id: S-012
    title: RequestService — create, fetch, applyTransition (transaction + StatusEvent)
    status: done
    hours: 1.5
    depends_on: [S-010, S-011]
    criteria: [AC-9-invalid, AC-9-attribution, AC-9-history]
  - id: S-013
    title: Integration tests against praetoria_test DB
    status: done
    hours: 1
    depends_on: [S-012]
    criteria: [AC-9-invalid, AC-9-attribution]
  - id: S-014
    title: Server actions (thin) + expire-drafts entry point
    status: done
    hours: 0.75
    depends_on: [S-012]
    criteria: [AC-9-expire]
---

# Sprint 2 — Request persistence (issue #9)

- Acceptance (issue #9 "Criterios de aceptación"):
  - [x] Migrations (`20260829203449_init`) + model documented in docs/03-technical-plan.md; a diagram is still pending (Phase 6 / a follow-up)
  - [x] Invalid transitions cannot be executed (`applyTransition` → `validateTransition`; integration test asserts no `StatusEvent` is written on rejection)
  - [x] Every status change records author, moment and reason (`StatusEvent` created in the same `$transaction`; `actorType` + `actorId` + `reason`; reason-required transitions enforced)
  - [x] Incomplete drafts can expire and be deleted (`deleteExpiredDrafts` + pure `isDraftExpired`; integration test proves only stale never-submitted BORRADOR rows go)
  - [x] Indexes for the panel's common searches (in schema: status, trade, municipality, createdAt, submittedAt)
- Notes: builds on the committed Prisma schema. `validateTransition()` already tested; this sprint
  added persistence + attribution + Zod input schemas + thin server actions.
- Close-out (2026-08-29, session 2): Delivered `src/domain/requests/{schema.ts,draft.ts}`,
  `src/server/services/requests.ts` (RequestService — createDraft, getById/getByReference,
  describeProblem+coverage, attachContact+granular consent+phone normalisation, applyTransition
  transactional with StatusEvent, idempotent submit, deleteExpiredDrafts),
  `src/server/actions/requests.ts` (4 thin actions). Tests: 5 pure (draft expiry) + 9 integration
  against `praetoria_test` — all green (44 total in the suite). TP-4. Pending: an ER diagram of the
  model (deferred to Phase 6). Next: issue #3 completion, then issue #6.
