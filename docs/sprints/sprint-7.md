---
schema: keel.sprint/1
sprint: 7
goal: Quotes / presupuestos with the benchmark D4 mandatory line items (issue #12)
status: done
slices:
  - id: S-035
    title: quote money math + completeness gate (pure, test-first)
    status: done
    hours: 1
    depends_on: []
    criteria: [AC-12-nofloat, AC-12-incomplete]
  - id: S-036
    title: Prisma QuoteLine + D4 fields migration
    status: done
    hours: 0.5
    depends_on: []
    criteria: []
  - id: S-037
    title: quoteService (versioned draft, send gate, client decision + evidence, expiry)
    status: done
    hours: 1.5
    depends_on: [S-035, S-036]
    criteria: [AC-12-versions, AC-12-nosilent]
  - id: S-038
    title: /admin/solicitudes/[ref]/presupuesto editor + preview
    status: done
    hours: 2
    depends_on: [S-037]
    criteria: [AC-12-distinguish, AC-12-mobile]
---

# Sprint 7 — Quotes (issue #12, benchmark D4)

- Acceptance (issue #12):
  - [x] Los cálculos monetarios no usan coma flotante — `lib/money.ts` integer cents throughout;
    `computeTotals` sums charged lines + IVA in basis points
  - [x] No se puede enviar un presupuesto incompleto — `checkComplete` gate on `markSent`, returns
    the list of missing D4 fields to the editor
  - [x] El cliente distingue incluido, excluido, impuestos, total y plazo — line items carry
    `included` (false = shown but not charged), subtotal/IVA/total shown, `isEstimate` vs
    "precio cerrado", max total when it is an estimate
  - [x] Queda trazabilidad de versiones y envíos — versioned `Quote` rows, `sentAt`, `AdminActionLog`
  - [x] Un presupuesto aceptado no se modifica silenciosamente — a change after send creates a new
    version; `recordDecision` locks an accepted quote
- Benchmark D4 fields all present: visit/diagnosis fee (+ discounted flag), call-out, labour,
  materials in/out, prep, removal/cleanup, taxes, assumptions[], extras-approval note, assigned
  professional + verification scope, date/slot + duration, warranty text + responsible, max total /
  labelled estimate.
- Verification (TP-8): 7 pure + 5 quote integration tests (88 total green). Send moves
  EN_REVISION → PRESUPUESTO_PREPARADO → PRESUPUESTO_ENVIADO; client ACEPTADO → request ACEPTADA with
  evidence recorded; re-decision on an accepted quote refused.
- Note: `recordDecision` is called by the signed client link (issue #16).
