---
schema: keel.sprint/1
sprint: 20
goal: Local SEO architecture — /problemas + admin-controlled /zonas, indexed only with real content (issue #25)
status: done
slices:
  - id: S-115
    title: "domain: local-page eligibility rule (D10 guard) + src/config/problems.ts curated content (test-first)"
    status: done
    hours: 2
    depends_on: []
    criteria: [AC-25-empty, AC-25-unique]
  - id: S-116
    title: "schema: LocalPage (municipality, serviceKey?, real-content fields, status, noindex) + LocalPageStatus enum + migration"
    status: done
    hours: 1
    depends_on: [S-115]
    criteria: [AC-25-adminindex]
  - id: S-117
    title: "localPageService: create/update/setStatus/setNoindex/getPublic/listIndexable/listForAdmin (integration tests)"
    status: done
    hours: 1.5
    depends_on: [S-116]
    criteria: [AC-25-empty, AC-25-adminindex]
  - id: S-118
    title: "public: /problemas + /problemas/[slug] (problem template, JSON-LD, breadcrumbs, CTA); /zonas + /zonas/[municipio] (municipio template, 404 when no page, noindex honoured)"
    status: done
    hours: 2.5
    depends_on: [S-115, S-117]
    criteria: [AC-25-unique, AC-25-breadcrumbs, AC-25-cta, AC-25-empty]
  - id: S-119
    title: "bidirectional linking service↔problema↔zona + footer/nav indexes; sitemap adds problems + indexable zones; robots"
    status: done
    hours: 1.5
    depends_on: [S-118]
    criteria: [AC-25-orphan, AC-25-links]
  - id: S-120
    title: "admin: /admin/zonas list + editor (real-content fields, status, noindex toggle)"
    status: done
    hours: 2
    depends_on: [S-117]
    criteria: [AC-25-adminindex]
  - id: S-121
    title: "verify — tests, build, HTTP-status checks (canonical/sitemap/robots/404/noindex), E2E"
    status: done
    hours: 1
    depends_on: [S-115, S-116, S-117, S-118, S-119, S-120]
    criteria: [AC-25-empty, AC-25-unique, AC-25-orphan, AC-25-breadcrumbs, AC-25-cta, AC-25-httptests, AC-25-adminindex]
---

# Sprint 20 — Local SEO architecture (issue #25)

## Acceptance criteria (issue #25)
- [x] AC-25-orphan — no orphan pages (every problem/zone reachable from an index + cross-links).
- [x] AC-25-unique — every indexable page has unique content and a concrete use.
- [x] AC-25-empty — empty combinations stay noindex or are not generated.
- [x] AC-25-breadcrumbs — navigation + breadcrumbs reflect the hierarchy.
- [x] AC-25-cta — every template has a measurable CTA (analytics event).
- [x] AC-25-httptests — canonical, sitemap, robots and HTTP statuses are tested.
- [x] AC-25-adminindex — the admin controls indexation without editing code.

## Essential rule (D10)
No automatic "fontanero + cada municipio" combinations with the same text. A local page is indexable
ONLY with real specific info: real coverage, times, completed jobs, local FAQs, cases, authorised
photos, or other differentiating evidence.

## Design
- `/problemas/[slug]` comes from **`src/config/problems.ts`** — a curated, hand-written list. Every
  problem page has real content → always indexable. (Same model as `service-content.ts`.)
- `/zonas/[municipio]` is **CMS-backed** (`LocalPage`): a page exists only when an admin creates it,
  and is indexed only when it passes `isLocalPageIndexable` (covered municipality + a real coverage
  note + at least 2 of {typical services, response-time note, local FAQ, completed-jobs note} + not
  flagged noindex + published). No `LocalPage` → the route 404s. This is how "el administrador
  controla la indexación sin editar código" + "las combinaciones vacías no se generan".
- Bidirectional linking: service ↔ problem ↔ zone, plus `/problemas` and `/zonas` indexes in the
  footer, so nothing is orphaned.
