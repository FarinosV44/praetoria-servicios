# Issues — Praetoria Servicios

> Living log of forge issues (GitHub: FarinosV44/praetoria-servicios). Inventory first, one entry per issue worked.
> Updated the moment an issue is triaged, worked, or closed.
> Last inbound sweep: 2026-08-29 22:30 — read existing comments on #1/#4/#5/#12 (competitive-benchmark refinements); folded them into docs/02-functional-spec.md ("Refinements from issue comments"). No new issues since #27. No comment requires a reply yet.

## Build order (dependency-sorted)

MVP core (this engagement, first): #2 → #9 → #3 → #6 → #10 → #5 → #7 → #8 → #11 → #12 → #13 → #16 → #14 → #15 → #4 → #17 → #18 → #19 → (#1 EPIC closes when all land).
Growth (after core): #22 → #21 → #23 → #24 → #25 → #26 → #20 → #27.

Rationale: data model (#9) and design tokens (#3) underpin everything. Photos (#6) and contact/consent (#10) feed the assistant (#5). AI analysis (#7) then user validation (#8). Admin (#11) then quotes (#12) then comms (#13) then client status link (#16). Insurance (#14→#15) is an optional branch. Landing (#4) can be built once components + flow entry points exist. Security review (#17), SEO/analytics (#18) and E2E/deploy (#19) are cross-cutting closers.

## Inventory
| # | Title | Type | Priority | Status | Entry |
|---|-------|------|----------|--------|-------|
| 1 | [EPIC] MVP funcional de Praetoria Servicios | epic | — | open | — |
| 2 | Inicializar arquitectura, stack y entorno reproducible | task | high | resolved — awaiting user close | E-001 |
| 3 | Identidad visual y sistema de diseño premium mobile-first | task | high | open | — |
| 4 | Landing comercial orientada a conversión | feature | med | open | — |
| 5 | Asistente visual para iniciar una solicitud doméstica | feature | high | open | — |
| 6 | Captura, subida y gestión segura de fotografías | feature | high | open | — |
| 7 | Análisis multimodal del problema mediante IA | feature | high | open | — |
| 8 | Validación, corrección y nuevo análisis por el usuario | feature | high | open | — |
| 9 | Modelar solicitudes, estados y trazabilidad de negocio | task | high | open | — |
| 10 | Captar contacto, consentimiento y preferencia de comunicación | feature | high | open | — |
| 11 | Autenticación y panel administrativo de solicitudes | feature | high | open | — |
| 12 | Gestionar presupuestos y plazos desde administración | feature | high | open | — |
| 13 | Comunicaciones por email y WhatsApp sin bloquear el MVP | feature | med | open | — |
| 14 | Subir y procesar una póliza de seguro de hogar | feature | med | open | — |
| 15 | Analizar cobertura y generar borrador jurídico revisable | feature | med | open | — |
| 16 | Consulta segura del estado y respuesta del cliente | feature | high | open | — |
| 17 | Seguridad, privacidad, retención y protección contra abuso | task | high | open | — |
| 18 | SEO local, analítica de conversión y páginas de servicio | feature | med | open | — |
| 19 | Pruebas E2E, observabilidad, accesibilidad y despliegue | task | high | open | — |
| 20 | Página de captación de profesionales | feature | low | open | — |
| 21 | Carta de Confianza Praetoria y transparencia | feature | med | open | — |
| 22 | Verificar y gestionar la red de profesionales | feature | med | open | — |
| 23 | Cierre de servicio, garantía e incidencias post-trabajo | feature | med | open | — |
| 24 | CMS editorial completo para publicaciones y guías | feature | med | open | — |
| 25 | Arquitectura SEO de servicios, problemas y municipios | feature | med | open | — |
| 26 | Reseñas verificadas y reputación local | feature | med | open | — |
| 27 | Centro de control SEO local y oportunidades de contenido | feature | low | open | — |

## Entries (one per issue worked)

### E-001 — #2 Inicializar arquitectura, stack y entorno reproducible
- Link: https://github.com/FarinosV44/praetoria-servicios/issues/2   Status: resolved 2026-08-29 — commented (beat 1); awaiting the user to close
- Diagnosis: n/a (greenfield task, not a bug)
- Resolution: Next.js 16 App Router + TS strict + Tailwind v4. Domain-oriented structure
  (`src/domain`, `src/adapters`, `src/lib`, `src/server`, `src/ui`, `src/config`). Prisma schema
  (full issue-#9 model) + generated initial migration. `docker-compose.yml` (Postgres 16). Zod
  everywhere; `src/lib/env.ts` validates process.env and never logs values. Adapter interfaces +
  mock/dev impls for AI / storage / email / WhatsApp / OCR + `src/server/container.ts` composition
  root. `.env.example` complete, no secrets. README (install/migrate/run/deploy). GitHub Actions CI
  (lint + typecheck + test + build + `npm audit`). Healthcheck `GET /api/health`. Temp landing.
  Founding design system (issue #3 partial).
- Changes: commits on `develop` — "chore: project scaffold + Keel foundation", "feat(#2): foundation".
- Verification: `npm run lint`, `npm run typecheck`, `npm test` (30 pass), `npx next build` — all green (TP-1, TP-2). TP-3 (session 2): migration applied against live PostgreSQL, seed OK, dev server up, `/` 200, `/api/health` → `{status:ok, checks:{database:true}}`. All issue-#2 acceptance criteria met.
- Replies: beat 1 — completion comment posted 2026-08-29 (see GitHub #2). No deploy stands between this and the user; they can close it directly.
- Deploy: n/a (infrastructure task, verified locally)
- Closed by: still open — the user closes it
- Inbound: none since the last sweep
- Lesson: L-001 (corrupt migration SQL), L-002 (blank env var) — both fixed
- Pending: user to close #2.
