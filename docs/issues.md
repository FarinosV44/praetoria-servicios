# Issues — Praetoria Servicios

> Living log of forge issues (GitHub: FarinosV44/praetoria-servicios). Inventory first, one entry per issue worked.
> Updated the moment an issue is triaged, worked, or closed.
> Last inbound sweep: 2026-08-29 20:00 — initial triage of all 27 open issues; no comments requiring action.

## Build order (dependency-sorted)

MVP core (this engagement, first): #2 → #9 → #3 → #6 → #10 → #5 → #7 → #8 → #11 → #12 → #13 → #16 → #14 → #15 → #4 → #17 → #18 → #19 → (#1 EPIC closes when all land).
Growth (after core): #22 → #21 → #23 → #24 → #25 → #26 → #20 → #27.

Rationale: data model (#9) and design tokens (#3) underpin everything. Photos (#6) and contact/consent (#10) feed the assistant (#5). AI analysis (#7) then user validation (#8). Admin (#11) then quotes (#12) then comms (#13) then client status link (#16). Insurance (#14→#15) is an optional branch. Landing (#4) can be built once components + flow entry points exist. Security review (#17), SEO/analytics (#18) and E2E/deploy (#19) are cross-cutting closers.

## Inventory
| # | Title | Type | Priority | Status | Entry |
|---|-------|------|----------|--------|-------|
| 1 | [EPIC] MVP funcional de Praetoria Servicios | epic | — | open | — |
| 2 | Inicializar arquitectura, stack y entorno reproducible | task | high | in progress | E-001 |
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
- Link: https://github.com/FarinosV44/praetoria-servicios/issues/2   Status: in progress
- Diagnosis: n/a (greenfield task, not a bug)
- Resolution: Scaffolded Next.js 16 App Router + TS strict + Tailwind v4 with create-next-app. Adding: domain-oriented structure (`src/domain`, `src/adapters`, `src/lib`, `src/server`, `src/ui`, `src/config`), Prisma + docker-compose Postgres, Zod, `src/lib/env.ts` (validated env), adapter interfaces with mock/dev impls, `.env.example`, README run/migrate/deploy section, GitHub Actions CI (lint + typecheck + test + build).
- Changes: (in progress) — commits on `develop`
- Verification: `npm run lint`, `npm run typecheck` (to add), `npm run build`, `npm test` (to add) must pass; healthcheck route responds.
- Replies: none yet
- Deploy: n/a
- Closed by: still open
- Inbound: none since the last sweep
- Lesson: none
- Pending: Prisma schema (shared with #9), CI workflow, README, healthcheck, dev seed.
