# Token ledger — Praetoria Servicios

> One row per working session. Estimated where the environment does not expose exact usage.
> Final reconciliation at release (Phase 7).

| Session | Date | Phase / work | Model | Tokens (approx) | Notes |
|---|---|---|---|---|---|
| 1 | 2026-08-29 | Setup + Phase 1/2 condensed + Sprint 1 (issue #2 foundation) | claude-sonnet-5 | ~1.5M in-context (of 15M budget) | Scaffold, Keel state, full data model, adapters, design system, 30 unit tests. |
| 2 | 2026-08-29 | Issue #2 verification (TP-3), Sprint 2 (issue #9 persistence, TP-4), benchmark #28 | claude-sonnet-5 | ~2.6M cumulative in-context | RequestService + 14 new tests (44 total); `docs/benchmark-competencia.md` + D1–D12; issue comments. |

Estimate (informal, no client budget — D-001): MVP core issues #1–#19 ≈ 30–60 AI working hours across
many sessions; growth #20–#27 a comparable amount again.
| 2 | 2026-08-29 | Sprints 3-7: #3 #5 #6 #7 #8 #10 #11 #12 + #2 verify + #28 benchmark | claude-sonnet-5 | ~5M cumulative in-context | design system, assistant flow (browser-verified), photos, admin panel (browser-verified), quotes; 88 tests |
| 3 | 2026-08-30 | Keel v5.19.0→v5.19.2 update; Sprint 8 (#13 email + WhatsApp comms, TP-9) | claude-sonnet-5 | ~0.3M this session (of 15M budget) | communications domain + service + admin panel; 20 new tests (108 total); browser-verified admin comms flow; L-003. |
| 3 | 2026-08-30 | Sprint 9 (#16 signed client status link, TP-10) + #13 retro-wire | claude-sonnet-5 | ~0.7M cumulative this session | client-view domain + clientLinkService + /s/[token] page + token-scoped uploads; 19 new tests (121 total); browser-verified client accept flow with evidence. |
| 3 | 2026-08-30 | Sprint 10 (#14 insurance upload + OCR + extraction, TP-11) | claude-sonnet-5 | ~1.1M cumulative this session | insurance domain + service + /api route + client section + admin panel; 24 new tests (145 total); curl + browser-verified upload/consent/extraction. |
| 3 | 2026-08-30 | Sprint 11 (#15 coverage analysis + reviewable legal draft, D5, TP-12) | claude-sonnet-5 | ~1.5M cumulative this session | coverage domain + service + admin panel + client view; 17 new tests (162 total); browser-verified admin review flow + client draft gating. |
| 3 | 2026-08-30 | Sprint 12 (#4 conversion landing D3/D9 + /legal/* provisional pages, TP-13) | claude-sonnet-5 | ~1.9M cumulative this session | landing rebuild + legal pages + centralised copy; no new tests (static markup); browser-verified render + CTA routing. |
