---
schema: keel.sprint/1
sprint: 9
goal: Secure client status link + response (issue #16), retro-wire #13 QUOTE_AVAILABLE URL
status: done
slices:
  - id: S-044
    title: client-view domain — internal status → comprehensible client status, phone last-4 check (pure, test-first)
    status: done
    hours: 1
    depends_on: []
    criteria: [AC-16-nointernal, AC-16-verify]
  - id: S-045
    title: clientLinkService — issue / resolve (rate-limited) / revoke / regenerate (verified) / client view
    status: done
    hours: 2
    depends_on: [S-044]
    criteria: [AC-16-nosequential, AC-16-noleak, AC-16-verify, AC-16-evidence]
  - id: S-046
    title: /s/[token] page + ClientStatusView (summary, status, quote, accept/reject, add info, ask clarification, recover access)
    status: done
    hours: 2.5
    depends_on: [S-045]
    criteria: [AC-16-nointernal, AC-16-evidence]
  - id: S-047
    title: token-scoped photo upload (/api/uploads accepts a link token) + client actions
    status: done
    hours: 1.5
    depends_on: [S-045]
    criteria: [AC-16-noleak]
  - id: S-048
    title: wire — issue a link on submit and on quote markSent; QUOTE_AVAILABLE + CONFIRMATION carry /s/<token>
    status: done
    hours: 1
    depends_on: [S-045]
    criteria: []
---

# Sprint 9 — Secure client status link (issue #16)

## Acceptance criteria (issue #16)
- [ ] AC-16-nosequential — a sequential id never grants access (`parseClientLink` verifies an
  HMAC-signed payload before any DB lookup; the DB stores only the SHA-256 hash).
- [ ] AC-16-noleak — the link exposes only its own request; a token-scoped upload / info add only
  ever touches that request.
- [ ] AC-16-verify — sensitive actions (accept / reject a quote, regenerate access) require the
  last 4 digits of the contact phone.
- [ ] AC-16-evidence — acceptance / rejection record date, quote version and evidence
  (`quoteService.recordDecision` — already built; the client link passes the evidence object).
- [ ] AC-16-nointernal — the page shows a comprehensible status, never a raw enum
  (`clientStatusView` maps every `RequestStatus` to a client-facing label + description).

## Design notes
- `lib/signed-link.ts` (issue #16 groundwork) and the `ClientLink` table already exist — **no
  migration**.
- Client "ask for clarification" and "add information" are stored as `ClientCorrection` rows
  (existing model: `clarification` free text, `wrongSections` empty for a plain message); the admin
  detail already renders them under "Correcciones del cliente".
- Rate limits `RATE_LIMITS.linkLookup` / `linkIssue` already exist.
- Retro-wire #13: `quoteService.markSent` issues a `ClientLink` and passes its `/s/<token>` URL to
  `communicationService.notify({ kind: "QUOTE_AVAILABLE", url })`. The URL is applied at send time
  only — never persisted on the `Communication` row (L-003 / #13 close-out note).

## Slices
S-044 → S-045 → S-046 → S-047 → S-048. Pure logic (status view, phone check) is test-first per D-007.

## Close-out (2026-08-30)

- **Acceptance criteria:**
  - [x] AC-16-nosequential — `clientLinkService.resolve` runs `parseClientLink` (HMAC verify) before
    any DB read, then matches the SHA-256 hash; passing a request id or a mangled token fails.
    Confirmed in the browser too (a secret mismatch → "No hemos podido abrir este enlace").
  - [x] AC-16-noleak — `getClientView` selects only that request's rows; the token-scoped
    `/api/uploads` resolves the token to exactly one request id; the page never renders internal
    notes or other requests.
  - [x] AC-16-verify — accept / reject and access regeneration require the last 4 digits of the
    contact phone (`phoneLast4Matches`, constant-time-ish). Browser: `9999` rejected with a clear
    message, `5444` accepted.
  - [x] AC-16-evidence — `decideQuote` calls `quoteService.recordDecision` with
    `{ via: "signed-link", decidedAt, quoteVersion, ip, userAgent }`; DB row after the browser run:
    `Request ACEPTADA`, `Quote ACEPTADO`, `decisionEvidence = {via: signed-link, quoteVersion: 1, ip: ::1}`.
  - [x] AC-16-nointernal — `clientStatusView` maps all 11 `RequestStatus` values to a plain label +
    description; a unit test asserts the label/description never contains the enum token.
- **Recover access:** `/s/[token]` shows a recovery form on an expired/revoked/invalid link;
  `regenerateAccessAction` (rate-limited `linkIssue`) verifies reference + phone last-4, revokes old
  links, issues a new one.
- **Retro-wire #13:** `quoteService.markSent` now issues a `ClientLink` and passes its `/s/<token>`
  URL to `communicationService.notify({ kind: "QUOTE_AVAILABLE", url })`; `finishRequestAction`
  issues a link on submit and passes it into CONFIRMATION. `communicationService.notify` sends the
  live-context email directly (URL applied at send time, **never persisted** on the row); if that
  send fails the row stays PENDING and `sendPending` later delivers the stored URL-less fallback body.
- **Token-scoped upload:** `/api/uploads` accepts a `token` field (alternative to `requestId`);
  `PhotoUpload` gained a `linkToken` prop (sends `token`, disables remove/reorder). Only allowed
  while the request is `REQUIERE_INFORMACION` (photoService `EDITABLE_STATUSES`).
- **Verification (TP-10):** 13 pure (client-view 4 + phone last-4 3 added, +6 clientLink) + 6
  clientLink integration tests; full suite 121/121 green; lint/typecheck/build clean. Browser drive
  of `/s/[token]`: full quote view with all D4 fields, wrong-code rejection, correct-code
  acceptance, DB evidence verified; no console errors.
- **Lessons:** none failed. One env gotcha (not a code bug): the signed-link token is only valid
  under the same `SIGNED_LINK_SECRET` that minted it — the dev browser check needed the dev server
  started with the same secret the seed used. Recorded in `docs/playground.md`.
