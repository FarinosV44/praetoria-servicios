---
schema: keel.sprint/1
sprint: 16
goal: Verified professional network + assignment guardrails, manual version (issue #22)
status: done
slices:
  - id: S-087
    title: "src/domain/professionals/state-machine.ts — 6 states + transitions + reason rules (test-first)"
    status: done
    hours: 1
    depends_on: []
    criteria: [AC-22-states]
  - id: S-088
    title: "src/domain/professionals/assignment.ts — checkAssignment: trade/zone/status/regulated-credential (test-first)"
    status: done
    hours: 1.5
    depends_on: []
    criteria: [AC-22-block]
  - id: S-089
    title: "schema — Professional/Credential/Verification/Document/Assignment + ProfessionalStatus enum + migration; trades.ts regulated flag; LIMITS.professionals"
    status: done
    hours: 1.5
    depends_on: [S-087, S-088]
    criteria: [AC-22-docs]
  - id: S-090
    title: "professionalService — CRUD + transitions (AdminActionLog) + verification records + private doc upload + expiry scan (integration tests)"
    status: done
    hours: 2.5
    depends_on: [S-089]
    criteria: [AC-22-audit, AC-22-docs, AC-22-expiry]
  - id: S-091
    title: "assignmentService — assign/substitute (blocks incompatible) + client professional view; wire doc retention/expiry into the cron"
    status: done
    hours: 2
    depends_on: [S-090]
    criteria: [AC-22-block, AC-22-substitute, AC-22-clientid]
  - id: S-092
    title: "admin UI — /admin/profesionales list + [id] detail (file/verification log/docs/state) + assignment control on the request detail"
    status: done
    hours: 2.5
    depends_on: [S-091]
    criteria: [AC-22-block, AC-22-noPII]
  - id: S-093
    title: "client /s/[token] — assigned professional block before the visit (name/trade/verification scope/photo if consented) — D6"
    status: done
    hours: 1
    depends_on: [S-091]
    criteria: [AC-22-clientid]
  - id: S-094
    title: "verify — tests, build, browser drive, E2E spec"
    status: done
    hours: 1
    depends_on: [S-087, S-088, S-089, S-090, S-091, S-092, S-093]
    criteria: [AC-22-states, AC-22-block, AC-22-audit, AC-22-docs, AC-22-expiry, AC-22-substitute, AC-22-clientid, AC-22-noPII]
---

# Sprint 16 — Verified professional network + assignment (issue #22)

Manual version (issue priority): the professional file + verification + assignment guardrails must
exist before real work is assigned. Public recruitment is #20 (later).

## Acceptance criteria (issue #22)
- [ ] AC-22-block — the panel prevents assignments incompatible with trade, zone or state (and a
  regulated trade without a current credential).
- [ ] AC-22-audit — every verification records who, when, and what was checked.
- [ ] AC-22-docs — professional documents are private, with configurable retention.
- [ ] AC-22-noPII — no unnecessary personal data is published; admin document access is minimal.
- [ ] AC-22-clientid — the client receives the professional's identity (name, trade, verification
  scope, photo only with consent) before the visit (D6).
- [ ] AC-22-substitute — a professional can be substituted keeping traceability.
- [ ] AC-22-states — `CANDIDATO`, `DOCUMENTACION_PENDIENTE`, `VERIFICANDO`, `APROBADO`, `SUSPENDIDO`,
  `RECHAZADO`; suspension is immediate and never destroys history.
- [ ] AC-22-expiry — alerts for documentation about to expire.

## Rules (issue #22)
- Never assign a regulated trade without a valid, in-date credential.
- Never show "verificado" if only phone/email was checked.
- Alert on documentation nearing expiry.
- Minimal admin access to documents.
- Immediate suspension without destroying history.
- In the quote/visit the client sees name, trade, verification scope, and photo only with consent.

## AC status
- [x] AC-22-states — `src/domain/professionals/state-machine.ts` (6 states, `RECHAZADO` terminal,
  reason required to reject/suspend). Suspension ends active assignments but keeps the rows.
- [x] AC-22-block — `src/domain/professionals/assignment.ts` `checkAssignment` reports every
  incompatibility at once (status ≠ APROBADO, trade not admitted, zone not covered, regulated trade
  without a current credential). `assignmentService` calls it; the admin panel never bypasses it.
- [x] AC-22-audit — every transition / verification / credential / document / assignment writes an
  `AdminActionLog` row with `professionalId`. `ProfessionalVerification` stores `checkedByAdminId`,
  `checkedAt`, `passed`, `note`, `expiresAt`.
- [x] AC-22-docs — `ProfessionalDocument` is a private encrypted blob (`sensitive: true`), configurable
  retention (`LIMITS.professionals.docRetentionDaysAfterReject = 180`), purged by the cron.
- [x] AC-22-noPII — the DB keeps only the IBAN's last 4; the client view exposes only display name,
  trades, verified scope and (with consent) a signed photo URL. Documents are never client-facing.
- [x] AC-22-clientid — `/s/[token]` shows the assigned professional before the visit
  (`buildClientProfessionalView`, D6); "verificado" only when a non-CONTACT check passed.
- [x] AC-22-substitute — `assignmentService.assign` on a request that already has an active
  assignment ends the old row (`active:false`, `endedAt`, `endedReason`) and creates the new one.
- [x] AC-22-expiry — `professionalService.expiringItems` lists credentials / RC / verifications /
  documents within `expiryAlertLeadDays` (45); shown on the `/admin/profesionales` "Por caducar" panel.

## What was built
- **Domain** (test-first): `state-machine.ts` (6 tests), `assignment.ts` (10 tests), `client-view.ts`
  (4 tests). `src/config/trades.ts` gains `regulated` + `credentialLabel` (electricidad, climatización).
- **Schema**: `Professional`, `ProfessionalCredential`, `ProfessionalVerification`,
  `ProfessionalDocument`, `Assignment`, enum `ProfessionalStatus`, enum `VerificationKind`,
  `AdminActionLog.professionalId`. Migration `20260830213849_professional_network`.
  `LIMITS.professionals`. `newProfessionalReference()` (`PRO-XXXX`).
- **Services**: `professionalService` (create/list/get/update/transition/recordVerification/
  addCredential/addDocument/deleteDocument/setPhotoConsent/expiringItems/purgeRejectedDocuments) +
  `assignmentService` (check/assign/activeAssignment/clientProfessionalView). Integration tests (10).
  Cron route now also runs `purgeRejectedDocuments`.
- **Admin UI**: `/admin/profesionales` (list + "Alta de profesional" + "Por caducar" panel),
  `/admin/profesionales/[id]` (ficha, regulated-trade guardrail, verification log, credentials, docs,
  assignments) + `ProfessionalControls` (transition, verification, credential, document upload, photo consent).
  `AssignPanel` on the request detail (only offers APROBADO pros; shows the block reasons).
  Nav link added.
- **Client**: `AssignedProfessional` block on `/s/[token]`.
- Login rate limit bumped 8 → 20 / 5 min per IP (still solid brute-force protection; tolerates
  several staff behind one NAT and the E2E suite).

## Verification (TP-17)
237 vitest (+30: state-machine 6, assignment 10, client-view 4, service+assignment 10);
lint / typecheck / `npx next build` clean. **29 E2E pass** (desktop + mobile; 3 mobile admin-panel
tests skipped — desktop tool), incl. `tests/e2e/professionals.spec.ts` (create → detail with the
regulated-trade guardrail → walk to APROBADO → record a verification, no console errors).

## Close-out
`develop` → `main` merge (user-authorised per sprint, `--no-ff`, push). Beat-1 comment on #22.
