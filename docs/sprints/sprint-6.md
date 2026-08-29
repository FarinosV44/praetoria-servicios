---
schema: keel.sprint/1
sprint: 6
goal: Admin authentication + operational inbox (issue #11)
status: done
slices:
  - id: S-031
    title: password hashing (scrypt) + tests
    status: done
    hours: 0.5
    depends_on: []
    criteria: []
  - id: S-032
    title: minimal signed-cookie admin session + proxy guard
    status: done
    hours: 1
    depends_on: [S-031]
    criteria: [AC-11-noaccess]
  - id: S-033
    title: adminService (list+filters+search, detail, classify, status, more-info, kpis, action log)
    status: done
    hours: 1.75
    depends_on: [S-032]
    criteria: [AC-11-log, AC-11-tempaccess]
  - id: S-034
    title: /admin/login, /admin inbox, /admin/solicitudes/[ref] detail + Controls
    status: done
    hours: 2.25
    depends_on: [S-033]
    criteria: [AC-11-filtersurl, AC-11-emptystates, AC-11-confirm, AC-11-tablet]
---

# Sprint 6 — Admin panel (issue #11)

- Acceptance (issue #11):
  - [x] Ninguna ruta administrativa accesible sin autorización — `src/proxy.ts` redirects `/admin/*`
    (except `/admin/login`) + `(panel)/layout.tsx` `getSession()` guard + every server action calls
    `requireSession()` (per-resource, not route-only)
  - [x] Fotos/documentos con acceso temporal — `adminService.getDetail` returns 10-min signed URLs
  - [x] Filtros se reflejan en URL — the list form is `method="get"`; pagination links carry the query
  - [x] Estados vacíos y errores diseñados — `EmptyState`, `Alert`
  - [x] Acciones críticas requieren confirmación — `Modal` for RECHAZADA/CANCELADA/CERRADA + any
    reason-required transition
  - [x] Operativa también en tablet — responsive grid, `overflow-x` table
  - [x] Registro de quién realiza cada acción — `AdminActionLog` on classify / status / more-info
- Auth: scrypt password hashing (`lib/password.ts`, no dependency); HMAC-signed httpOnly sameSite
  cookie (`server/auth.ts`), 8 h TTL; login rate-limited; uniform-timing verify for unknown users.
- Verification (TP-7): 4 password unit + 6 admin integration tests (76 total green). Browser
  walkthrough: unauth `/admin` → 307 to `/admin/login`; login `admin@praetoria.local` → inbox with
  KPIs (2 nuevas / 5 pendientes / 0 near-deadline / 2 cerradas) + filters + table (drafts excluded);
  open PS-W25F-TAYZ detail; "Cambiar estado → EN_REVISION". DB: status EN_REVISION,
  StatusEvent `PENDIENTE_ANALISIS/SYSTEM → EN_REVISION/ADMIN`, 1 AdminActionLog row.
- Note: seed's admin password now uses the real hasher. Auth.js not used — a minimal
  dependency-free session was lower risk with Next 16 (recorded as D-012).
