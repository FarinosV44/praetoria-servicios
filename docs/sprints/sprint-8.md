---
schema: keel.sprint/1
sprint: 8
goal: Email + WhatsApp communications without blocking the MVP (issue #13)
status: done
slices:
  - id: S-039
    title: communications domain — templates, channel/consent selection, idempotency key (pure, test-first)
    status: done
    hours: 1.5
    depends_on: []
    criteria: [AC-13-simmode, AC-13-nomarketing]
  - id: S-040
    title: centralised comms copy (brand-configurable) in src/config/copy
    status: done
    hours: 0.5
    depends_on: []
    criteria: []
  - id: S-041
    title: communicationService — enqueue (idempotent), sendPending queue + retry, WhatsApp link prepare, listForRequest
    status: done
    hours: 2
    depends_on: [S-039, S-040]
    criteria: [AC-13-nolost, AC-13-status, AC-13-simmode, AC-13-nomarketing]
  - id: S-042
    title: wire — submit→CONFIRMATION, requestMoreInfo→INFO_REQUEST, quote markSent→QUOTE_AVAILABLE
    status: done
    hours: 1
    depends_on: [S-041]
    criteria: [AC-13-nolost]
  - id: S-043
    title: admin comms actions + CommsPanel on request detail (pendiente/enviado/fallido + generar enlace WhatsApp)
    status: done
    hours: 1.5
    depends_on: [S-041]
    criteria: [AC-13-status]
---

# Sprint 8 — Communications (issue #13)

## Acceptance criteria (issue #13)
- [ ] AC-13-nolost — Un fallo de comunicación no pierde la solicitud (enqueue/send are best-effort;
  a failed send writes a `Communication` row with status FAILED and never rolls back the request).
- [ ] AC-13-status — El administrador ve pendiente/enviado/fallido (CommsPanel on the request detail).
- [ ] AC-13-expire — Los enlaces privados caducan (the signed `/s/<token>` link is issue #16; this
  sprint's QUOTE_AVAILABLE template carries the URL slot and #16 retro-wires the real token. The
  WhatsApp deep link carries no secret. Recorded as delegated to #16.)
- [ ] AC-13-simmode — Existe modo simulado para desarrollo (`EMAIL_ADAPTER=memory|console`,
  `WHATSAPP_ADAPTER=link` — all already wired in the container; no real provider needed).
- [ ] AC-13-nomarketing — No se envía marketing bajo consentimiento operativo (`canSend` classifies
  each kind by purpose: transactional / operational / marketing; a marketing purpose requires
  `MARKETING` consent, which operational consent does not grant. v1 ships no marketing kind.)

## Design notes
- `Communication` model already exists (issue #9 schema): channel, kind, status
  (PENDING/SENT/FAILED/LINK_PREPARED), subject, bodyPreview, providerId, error, attempts.
  **No migration needed.**
- Adapters already exist: `Mailer` (memory/console), `WhatsappSender` (link). No adapter changes.
- Queue: `communicationService.sendPending()` is called by an admin action now; a scheduled/cron
  runner is wired in issue #19 (same pattern as `requestService.deleteExpiredDrafts`).
- WhatsApp is always "link prepared" — the row is `LINK_PREPARED`, never `SENT`; the UI never claims
  an automatic send (issue #13 explicit requirement).
- No secrets/tokens stored in the `Communication` row — `bodyPreview` is a truncated rendered body.

## Slices
S-039 → S-040 → S-041 → S-042 → S-043. Pure logic (templates, channel/consent selection,
idempotency key) is test-first per D-007.

## Close-out (2026-08-30)

- **Acceptance criteria:**
  - [x] AC-13-nolost — `communicationService.notify` is best-effort (try/catch); a failing send
    writes a `Communication` row `status=FAILED` and never rolls back the request. Integration test
    "a send failure records FAILED and never loses the request" (injected failing mailer; request
    stays `PENDIENTE_ANALISIS`).
  - [x] AC-13-status — CommsPanel on `/admin/solicitudes/[ref]` lists every communication with a
    status chip (pendiente / enviado / fallido / enlace preparado), attempt count and error. Driven
    in the browser: INFO_REQUEST on a WhatsApp-channel request created a `LINK_PREPARED` row shown
    in the panel with a working "Generar enlace de WhatsApp" button.
  - [~] AC-13-expire — the client-facing private link is the signed `/s/<token>` link, built in
    issue #16. This sprint's QUOTE_AVAILABLE template carries the URL slot; #16 retro-wires the real
    token and its expiry. The WhatsApp deep link carries no secret. **Delegated to #16.**
  - [x] AC-13-simmode — `EMAIL_ADAPTER=memory|console`, `WHATSAPP_ADAPTER=link` (all in
    `src/server/container.ts`); the full suite and the browser drive ran with no real provider.
  - [x] AC-13-nomarketing — `canSend(kind, consents)` classifies each kind by purpose; a
    `marketing` purpose needs explicit `MARKETING` consent, which `OPERATIONAL_COMMS` never grants.
    v1 ships no marketing kind. Unit test "a marketing-purpose message needs explicit marketing
    consent, not operational".
- **Queue/retry:** `sendPending({max})` processes PENDING email rows with `attempts < maxAttempts`
  (config `LIMITS.communications.maxAttempts = 4`); `retry(requestId?)` moves eligible FAILED rows
  back to PENDING. A scheduled runner is issue #19 (same pattern as `deleteExpiredDrafts`).
- **Idempotency:** `enqueue` is a no-op (returns the existing row, `skipped:true`) when a non-FAILED
  row for the same `(requestId, kind)` exists.
- **No secrets stored:** the `Communication` row keeps `subject` + a ≤4000-char rendered plain-text
  body in `bodyPreview`; the signed `/s/<token>` URL is applied only at send time (issue #16), never
  persisted.
- **No migration** — the `Communication` model already existed (issue #9 schema).
- **Verification (TP-9):** 14 pure + 6 integration tests; full suite 108/108 green; `npm run lint`,
  `npm run typecheck`, `npx next build` clean. Browser drive: admin login → request detail →
  "Pedir información al cliente" → status EN_REVISION→REQUIERE_INFORMACION, CONFIRMATION panel row
  `LINK_PREPARED`, WhatsApp deep link opens pre-filled with the admin's message.
- **Lessons:** none failed. One defect caught and fixed within the sprint by the browser drive:
  `whatsappLink` first re-rendered the template without the admin message (INFO_REQUEST link had an
  empty body) — fixed to use the persisted `bodyPreview`. Recorded as L-003.
