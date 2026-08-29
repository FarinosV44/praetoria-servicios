# 02 — Functional spec (condensed)

The authoritative requirements are the **GitHub issues** themselves. This document maps them to
flows, screens and acceptance criteria groups, and records cross-issue rules so no slice re-derives
them.

## Actors

- **Client** — a resident with a home problem. No account. Identified by name + phone/email.
  Interacts via the assistant and, later, a signed status link.
- **Admin** — Praetoria staff. Authenticated. Manages requests, quotes, communications, insurance
  review, and (growth) the professional network and content.
- **AI adapter** — vision+text model that produces the structured analysis (#7) and the coverage
  analysis / legal draft (#15).

## Flows → issues

| Flow | Issues | Key screens |
|------|--------|-------------|
| F1 Landing → CTA | #4, #3, #18 | `/` marketing |
| F2 Assistant (create request) | #5, #6, #10, #9 | `/solicitar` wizard (category → photos → explanation → location → analysis → validation → contact → done) |
| F3 AI analysis | #7 | inline in F2 (analysis step) |
| F4 Validation / correction / re-analysis | #8 | inline in F2 (validation step) |
| F5 Admin inbox & detail | #11, #9 | `/admin`, `/admin/solicitudes/[ref]` |
| F6 Quote management | #12 | `/admin/solicitudes/[ref]/presupuesto` |
| F7 Communications (email + WhatsApp) | #13 | admin actions; email templates; WA link |
| F8 Client status link | #16 | `/s/[token]` |
| F9 Insurance upload | #14 | `/solicitar` optional step + `/s/[token]` |
| F10 Coverage analysis + legal draft | #15 | admin review screen |
| F11 Security/privacy/retention | #17 | cross-cutting; admin export/delete; retention jobs |
| F12 SEO + analytics + service pages | #18 | `/servicios/[slug]`, `/cobertura`, event tracking |
| F13 E2E + observability + deploy | #19 | CI, healthcheck, runbook |

## Request lifecycle (issue #9) — state machine

States: `BORRADOR`, `PENDIENTE_ANALISIS`, `REQUIERE_INFORMACION`, `VALIDADA_CLIENTE`, `EN_REVISION`,
`PRESUPUESTO_PREPARADO`, `PRESUPUESTO_ENVIADO`, `ACEPTADA`, `RECHAZADA`, `CANCELADA`, `CERRADA`.

Allowed transitions (server-validated; every transition records author, timestamp, reason):

```
BORRADOR            → PENDIENTE_ANALISIS | CANCELADA
PENDIENTE_ANALISIS  → REQUIERE_INFORMACION | VALIDADA_CLIENTE | EN_REVISION | CANCELADA
REQUIERE_INFORMACION→ PENDIENTE_ANALISIS | VALIDADA_CLIENTE | CANCELADA
VALIDADA_CLIENTE    → EN_REVISION | CANCELADA
EN_REVISION         → REQUIERE_INFORMACION | PRESUPUESTO_PREPARADO | RECHAZADA | CANCELADA
PRESUPUESTO_PREPARADO → PRESUPUESTO_ENVIADO | EN_REVISION | CANCELADA
PRESUPUESTO_ENVIADO → ACEPTADA | RECHAZADA | CANCELADA
ACEPTADA            → CERRADA | CANCELADA
RECHAZADA           → EN_REVISION | CERRADA
CANCELADA           → (terminal)
CERRADA             → (terminal)
```

Notes: a `BORRADOR` can expire and be deleted (retention). The client submitting the assistant moves
`BORRADOR → PENDIENTE_ANALISIS`. AI completing analysis stays `PENDIENTE_ANALISIS` (or
`REQUIERE_INFORMACION` if it asks for more). Client confirming the final analysis version →
`VALIDADA_CLIENTE`. Admin picking it up → `EN_REVISION`.

## Cross-issue rules (apply to every relevant slice)

1. **AI output is always "orientativo"** — never "diagnóstico definitivo". UI copy and the analysis
   schema both carry this. (#7, #4, #8)
2. **Insurance coverage is never "garantizada"** — every coverage output is "probable / exclusión
   probable / dudosa / información insuficiente" and the legal draft is labelled "borrador pendiente
   de revisión" until an admin explicitly marks it reviewed. (#15, #4)
3. **Public identifiers are random, non-sequential.** (#9, #11, #16) — D-009.
4. **Money is integer cents, no floats.** (#12) — D-010.
5. **No mandatory account for clients.** Everything client-side works via the assistant draft
   (local + server) and signed links. (#5, #10, #16)
6. **Private files only.** Photos and policies are never public or indexable; access is via
   short-lived signed URLs tied to the request lifecycle. (#6, #14, #17)
7. **Idempotent submission.** Double-submit creates one request. (#10)
8. **Consent is granular and never pre-checked.** Separate consents: request handling, operational
   comms, optional marketing, and (insurance) document analysis. (#10, #14, #18)
9. **PII never goes to analytics or logs.** Events carry no phone/email/description/photo. (#17, #18)
10. **Every state change is attributed and reason-stamped; history is immutable.** (#9, #11)
11. **Loading / error / empty / retry states are designed for every screen.** (EPIC, #5, #11)
12. **Keyboard + screen-reader operable, 320px→desktop, respects `prefers-reduced-motion`.** (#3, #5)
13. **Configurable, not hardcoded:** coverage municipalities/postcodes, limits (file count/size),
    target response deadline, recipients, provider keys — all via config/env. (EPIC, #2, #6, #10)

## Acceptance-criteria tracking

Each issue's `## Criterios de aceptación` checkboxes are the definition of done for that issue. As a
slice lands, its criteria are checked off in a per-issue note under `docs/sprints/` and reported to
the user. An issue is only proposed as "ready to close" (the user closes it) when every criterion is
met and verified.
