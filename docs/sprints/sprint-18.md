---
schema: keel.sprint/1
sprint: 18
goal: Documented service closure + incidences + warranty + review linkage (issue #23)
status: done
slices:
  - id: S-101
    title: "domain: incidence state machine + SLA + warranty-kind labels (test-first)"
    status: done
    hours: 1.5
    depends_on: []
    criteria: [AC-23-noclose, AC-23-sla]
  - id: S-102
    title: "schema: ServiceCompletion, Incidence, Review + WarrantyKind/IncidenceStatus enums + migration; src/config/service-closure.ts"
    status: done
    hours: 1.5
    depends_on: [S-101]
    criteria: [AC-23-expediente]
  - id: S-103
    title: "serviceClosureService (recordCompletion, confirmByClient→CERRADA, openIncidence, classify, resolve[reason+evidence], listOpenIncidences, buildExpediente) + reviewService (submit only if CERRADA, authorize, listAuthorized) — integration tests"
    status: done
    hours: 3
    depends_on: [S-102]
    criteria: [AC-23-noclose, AC-23-adminview, AC-23-expediente, AC-23-reviewlink, AC-23-econ]
  - id: S-104
    title: "client /s/[token]: 'Tengo un problema con el trabajo' + 'Confirmar que todo está bien' + warranty conditions + expediente download + post-close review form"
    status: done
    hours: 2
    depends_on: [S-103]
    criteria: [AC-23-button, AC-23-reviewlink]
  - id: S-105
    title: "admin: completion panel on the request detail + /admin/incidencias (open + due dates) + review authorization"
    status: done
    hours: 2.5
    depends_on: [S-103]
    criteria: [AC-23-adminview]
  - id: S-106
    title: "landing: 'reseñas reales autorizadas' section (honest empty state if none)"
    status: done
    hours: 0.5
    depends_on: [S-103]
    criteria: [AC-23-landing]
  - id: S-107
    title: "verify — tests, build, browser drive, E2E"
    status: done
    hours: 1
    depends_on: [S-101, S-102, S-103, S-104, S-105, S-106]
    criteria: [AC-23-button, AC-23-econ, AC-23-adminview, AC-23-reviewlink, AC-23-landing, AC-23-expediente]
---

# Sprint 18 — Service closure + incidences + warranty (issue #23)

## Acceptance criteria (issue #23)
- [ ] AC-23-button — the client has a clear "Tengo un problema con el trabajo" button.
- [ ] AC-23-econ — every economic modification is approved and traced (accepted quote version +
  approved extras, surfaced in the expediente).
- [ ] AC-23-adminview — the admin sees open incidences and their due dates.
- [ ] AC-23-reviewlink — a review is tied to a completed request.
- [ ] AC-23-landing — the landing shows only real, authorised opinions (honest empty state until there are any).
- [ ] AC-23-expediente — closure produces a comprehensible, downloadable expediente.
- [ ] AC-23-noclose — an incidence cannot be closed without a reason and evidence.
- [ ] AC-23-sla — an internal first-response SLA, without promising 24/7.

## Rules (issue #23)
- No fixed "1 año" or uniform term without legal/contractual validation.
- Differentiate garantía legal / garantía comercial / mera cortesía.
- Never allow reviews of non-existent work.
- Never close an incidence without reason + evidence.
- Internal first-response SLA, no 24/7 promise.

## Note on scope
The full verified-reviews / reputation system is issue #26. This sprint builds the *linkage* #23
requires: a private review tied to a CERRADA request, admin authorisation for publication, and a
landing section that only ever renders authorised real reviews.

## AC status
- [x] AC-23-button — `PostService` on `/s/[token]` shows "Tengo un problema con el trabajo" once the
  work is recorded (and after CERRADA); opens an `Incidence` (`openedBy: CLIENT`).
- [x] AC-23-econ — `ServiceCompletion.acceptedQuoteVersion` is pulled from the accepted quote;
  `approvedExtrasNote` captures how/when extras were approved; the expediente lists every quote
  version + the approved extras.
- [x] AC-23-adminview — `/admin/incidencias` lists open incidences ordered by `firstResponseDueAt`
  with an `overdue` flag; the request detail shows the request's incidences.
- [x] AC-23-reviewlink — `reviewService.submit` refuses unless `request.status === "CERRADA"`; one
  review per request; `Review.requestId` is unique.
- [x] AC-23-landing — the landing renders `reviewService.listPublished()` (status AUTORIZADA **and**
  `publishConsent` **and** request CERRADA); the section is hidden entirely when there are none.
- [x] AC-23-expediente — `buildExpediente` → a structured object; the client downloads it as JSON
  from `/s/[token]` via `getExpedienteAction`.
- [x] AC-23-noclose — `validateIncidenceTransition` requires a reason **and** evidence for
  RESUELTA / DESESTIMADA; `serviceClosure.test.ts` proves both refusals.
- [x] AC-23-sla — `firstResponseDueAt` from `SERVICE_CLOSURE.slaFirstResponseHours` (24h internal
  target); `SERVICE_CLOSURE.noPromiseNote` is shown to the client — explicitly "no 24/7".
- Warranty: `WarrantyKind` LEGAL / COMERCIAL / CORTESIA, each with an honest description; no uniform
  term. Shown on `/s/[token]` and captured in the completion.

## What was built
- **`src/domain/service-closure/incidence.ts`** (+10 tests, test-first) — incidence state machine
  (5 states, reason+evidence to close), SLA helpers, `WarrantyKind` + labels.
- **`src/config/service-closure.ts`** — SLA hours, incidence kinds, warranty descriptions, the
  "no 24/7" note.
- **Schema** (migration `20260830223651_service_closure_incidences`): `ServiceCompletion`,
  `Incidence`, `IncidenceEvent`, `Review` + `WarrantyKind` / `IncidenceStatus` / `ReviewStatus` enums.
- **`serviceClosureService`** (recordCompletion, confirmByClient → CERRADA, openIncidence,
  classifyIncidence, transitionIncidence, listOpenIncidences, buildExpediente) + **`reviewService`**
  (submit only if CERRADA, authorize, forRequest, listForAdmin, listPublished). Integration tests (8).
- **Client** `/s/[token]` — `PostService`: warranty conditions, "Confirmar que el trabajo está bien"
  (phone last-4 gated) + "Tengo un problema con el trabajo", review form (private by default,
  public only with consent + admin authorisation), expediente download.
- **Admin** — `CompletionPanel` on the request detail; `/admin/incidencias` (open incidences with
  due dates + overdue; pending reviews to authorise) with `IncidenceControls` / `ReviewControls`; nav link.
- **Landing** — an "Opiniones de clientes" section fed by `listPublished()`, hidden when empty.
- **`clientLinkService.phoneMatches`** — ownership check for the confirm action.

## Verification (TP-19)
261 vitest (+18); lint / typecheck / `npx next build` clean. 34 E2E pass (3 mobile admin-panel
tests skipped) incl. `/admin/incidencias` smoke.

## Close-out
`develop` → `main` merge (user-authorised per sprint, `--no-ff`, push). Beat-1 comment on #23.
