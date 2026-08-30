---
schema: keel.sprint/1
sprint: 10
goal: Insurance policy upload + OCR + tentative extraction with page references (issue #14)
status: done
slices:
  - id: S-049
    title: insurance domain — doc kinds, extraction parser with page refs, missing-docs, status (pure, test-first)
    status: done
    hours: 2
    depends_on: []
    criteria: [AC-14-pageref, AC-14-partial, AC-14-ocrmark]
  - id: S-050
    title: document validation — magic-byte PDF + image sniff, size/type limits
    status: done
    hours: 0.5
    depends_on: []
    criteria: [AC-14-private]
  - id: S-051
    title: insuranceService — ensureCase, consent, addDocument (sensitive blob), analyze (OCR + extract), getCase, delete + retention purge
    status: done
    hours: 2.5
    depends_on: [S-049, S-050]
    criteria: [AC-14-private, AC-14-ocrmark, AC-14-partial, AC-14-consent, AC-14-linkpolicy]
  - id: S-052
    title: POST /api/insurance/documents (signed link token or admin session) + client/admin actions
    status: done
    hours: 1.5
    depends_on: [S-051]
    criteria: [AC-14-private, AC-14-consent]
  - id: S-053
    title: admin insurance panel on request detail (case, docs, extraction, missing docs, delete)
    status: done
    hours: 1.5
    depends_on: [S-051]
    criteria: [AC-14-partial]
  - id: S-054
    title: /s/[token] insurance section (consent + which docs help + upload + missing docs)
    status: done
    hours: 1.5
    depends_on: [S-051]
    criteria: [AC-14-consent]
---

# Sprint 10 — Insurance policy upload (issue #14)

## Acceptance criteria (issue #14)
- [ ] AC-14-private — the file is never public (private `BlobStore` with `sensitive: true`, signed
  short-lived URLs only, download through the app's signed route).
- [ ] AC-14-ocrmark — PDFs with no text layer go through OCR (`OcrEngine`) or are marked unreadable
  (`extractionStatus = UNREADABLE`, `InsuranceDocument` shown as no legible).
- [ ] AC-14-pageref — every extracted field carries a `{ doc, page }` reference.
- [ ] AC-14-partial — a partial extraction is presented as `PARTIAL`, listing what is missing.
- [ ] AC-14-linkpolicy — the request's problem analysis can be linked to a specific policy
  (`InsuranceCase` is 1:1 with the request; #15 consumes it).
- [ ] AC-14-consent — a specific `INSURANCE_DOC_ANALYSIS` consent is required before any document is
  accepted or analysed.

## Design notes (benchmark D5)
- `InsuranceCase` / `InsuranceDocument` models and `ConsentType.INSURANCE_DOC_ANALYSIS` already
  exist (issue #9 schema) — **no migration**.
- `OcrEngine` mock returns canned "condiciones particulares / generales" text with page numbers and
  an `unreadable` flag for empty input.
- `BlobStore.put` already takes `sensitive?: boolean`; the fs adapter records it in the `.meta`.
- Coverage analysis + the legal draft are issue #15 (next sprint) — this sprint stops at the
  tentative extraction and "what looks missing".
- Never log document content (`lib/logging.ts` redaction covers it; pass only counts / page numbers).

## Slices
S-049 → S-050 → S-051 → S-052 → S-053 → S-054. Pure logic (extraction parser, status, missing-docs)
is test-first per D-007.

## Close-out (2026-08-30)

- **Acceptance criteria:**
  - [x] AC-14-private — `BlobStore.put({ sensitive: true })`; signed 10-min URLs only; the client
    section never gets a download URL, the admin panel gets a `memory://` / signed-route URL.
    Browser: admin panel shows "Ver (enlace temporal)".
  - [x] AC-14-ocrmark — `insuranceService.analyze` runs every document through `OcrEngine`; a page
    whose text came from OCR sets `InsuranceDocument.ocrUsed`; `extractionStatusFor` returns
    `UNREADABLE` when documents exist but nothing could be read. (Mock OCR yields text for the test
    PDF; the empty-input → `unreadable` path is unit-covered.)
  - [x] AC-14-pageref — every extracted item carries `{ doc, page }`. Browser (admin): garantías
    "Incendio (pág. 1)", exclusiones "falta de mantenimiento (pág. 2)", franquicia "90 EUR (pág. 1)".
  - [x] AC-14-partial — `extractionStatus` = `PARTIAL` when the core identity (insurer + policy +
    validity + a coverage) is incomplete; `missingSummary` lists what is missing. Browser: "Estado:
    Extracción parcial · Parece que falta: … Condiciones generales · No hemos identificado la aseguradora".
  - [x] AC-14-linkpolicy — `InsuranceCase` is 1:1 with the request (`requestId @unique`);
    `ensureCase` is idempotent. #15 consumes this case.
  - [x] AC-14-consent — a specific `INSURANCE_DOC_ANALYSIS` `Consent` row + `InsuranceCase.consentGiven`
    gate `addDocument` and `analyze`; the `/s/[token]` section shows a consent checkbox first.
    Integration test "refuses a document without the specific consent". Browser: consent → upload UI.
- **Security:** documents stored under `insurance/<caseId>/`, `sensitive: true`; logs carry only
  kind + byte size + page counts, never content; `deleteDocument` verifies the blob is gone
  (`storage.exists` → `delete_unverified` error otherwise); `purge` (retention) removes every blob +
  the case; admin `Eliminar` / `Eliminar todo (retención)` buttons + `AdminActionLog` rows.
- **Entry points:** `/s/[token]` insurance section (client); admin panel on the request detail. The
  assistant "seguro" intent path (an in-wizard upload step) is deferred to a follow-up — recorded in
  `docs/PROGRESS.md` deferred items; the two entry points above cover the AC.
- **Verification (TP-11):** 18 pure + 6 integration tests (145 total green); lint/typecheck/build
  clean. Browser drive on `localhost:3126`: `/s/[token]` consent grant → upload a PDF via
  `POST /api/insurance/documents` (201; bad-type → 422; no-origin → 403) → client section shows
  "Condiciones particulares · 2 pág. · Lectura parcial · póliza 000000" + missing summary; admin
  panel shows the full extraction with page refs, the temporary view link, and the delete/purge
  controls. DB: `consentGiven=t, extractionStatus=PARTIAL, 1 document`. No console errors.
- **Lessons:** none failed. Env note (already in `docs/playground.md`): `/api/*` mutating routes
  enforce `Origin === APP_URL`, so a dev server on a non-default port must be started with
  `APP_URL=http://localhost:<port>` for curl/browser POSTs to pass the origin check.
