---
schema: keel.sprint/1
sprint: 14
goal: SEO local + conversion analytics + service pages (issue #18) + CSP hydration fix (issue #29)
status: done
slices:
  - id: S-070
    title: src/lib/analytics.ts — PII-stripping event helper (test-first) + consent gate + provider seam
    status: done
    hours: 1.5
    depends_on: []
    criteria: [AC-18-nopii, AC-18-funnel]
  - id: S-071
    title: ANALYTICS consent — schema + ContactStep checkbox (never pre-checked) + persist + wire track()
    status: done
    hours: 1
    depends_on: [S-070]
    criteria: [AC-18-consent]
  - id: S-072
    title: SEO route files — robots.ts, sitemap.ts, manifest.ts, icon.tsx
    status: done
    hours: 1
    depends_on: []
    criteria: [AC-18-lighthouse]
  - id: S-073
    title: JSON-LD helpers (src/lib/seo.ts) + Organization/WebSite/FAQPage on /
    status: done
    hours: 1
    depends_on: [S-072]
    criteria: [AC-18-lighthouse]
  - id: S-074
    title: /servicios/[slug] + src/config/service-content.ts (real per-trade content, D10) + Service/Breadcrumb JSON-LD
    status: done
    hours: 3
    depends_on: [S-073]
    criteria: [AC-18-content]
  - id: S-075
    title: /cobertura page + coverage checker client component (no PII) + generateMetadata
    status: done
    hours: 1.5
    depends_on: [S-073]
    criteria: [AC-18-content]
  - id: S-076
    title: footer/nav links to /servicios + /cobertura; add new routes to sitemap
    status: done
    hours: 0.5
    depends_on: [S-074, S-075]
    criteria: []
  - id: S-078
    title: "issue #29 — CSP per-request nonce in src/proxy.ts + force-dynamic layout (repro test first)"
    status: done
    hours: 1.5
    depends_on: []
    criteria: [AC-29]
  - id: S-077
    title: verify — build/lint/typecheck, curl sitemap/robots/manifest, validate JSON-LD, browser-drive
    status: done
    hours: 1
    depends_on: [S-070, S-071, S-072, S-073, S-074, S-075, S-076, S-078]
    criteria: [AC-18-consent, AC-18-nopii, AC-18-funnel, AC-18-content, AC-18-lighthouse, AC-29]
---

# Sprint 14 — SEO local + conversion analytics + service pages (issue #18)

## Acceptance criteria (issue #18)
- [x] AC-18-consent — ANALYTICS consent, never pre-checked (`ContactStep`); `track()` no-ops without it
  (`analytics.test.ts` "does not fire without ANALYTICS consent"). Persisted as the 4th `Consent` row.
- [x] AC-18-nopii — `sanitizeProps` is an allowlist (`device`, `category`, `step`, `reason`, `count`,
  `durationMs` only); PII keys and PII-shaped values are dropped. `analytics.test.ts` asserts no
  phone/email/name/address/description/photo survives.
- [x] AC-18-funnel — every event carries `device` (mobile/tablet/desktop) and, where relevant,
  `category` (trade key). Funnel is queryable on those two dimensions.
- [x] AC-18-content — `/servicios/[slug]` for all 11 trades with genuine per-trade prose
  (`src/config/service-content.ts`: covers / typical problems / what the quote includes / how it
  works / insurance angle) — no "trade + municipality" duplication (D10). `/cobertura` with the real
  coverage table + a client-side checker.
- [x] AC-18-lighthouse — `robots.ts`, `sitemap.ts` (14 URLs), `manifest.ts` (`#b0522f`), `icon.tsx`,
  `generateMetadata` + canonical on every new page, JSON-LD (`Organization`, `WebSite`, `FAQPage`,
  `Service`, `BreadcrumbList`) — all fetched and validated by hand.

## Issue #29 (found during this sprint — CSP broke hydration)
- [x] AC-29 — the strict CSP from #17 (`script-src 'self'`, no nonce) blocked Next's inline
  hydration scripts → React #412 on every page, `/solicitar` stuck on the spinner. Fixed:
  per-request nonce in `src/proxy.ts` (`'nonce-…' 'strict-dynamic'`, `x-nonce`), `export const
  dynamic = "force-dynamic"` in `src/app/layout.tsx` so the nonce reaches statically-shaped pages.
  CSP moved out of `next.config.ts`. `src/proxy.test.ts` (6) — failing reproduction written first.
  Browser-verified: assistant hydrates and advances, `/cobertura` checker works, console clean.

## D10 (functional spec)
Honest local SEO: a municipality page is indexed only with real specific content; no
"trade + every municipality" duplication. Only `/servicios/[slug]` (real per-trade prose) and
`/cobertura` (real coverage data) are indexable — no per-municipality pages.

## What was built
- **`src/lib/analytics.ts`** (+9 tests, test-first) — fixed 16-event union, `sanitizeProps` allowlist,
  `setAnalyticsConsent`/`isAnalyticsAllowed` (localStorage + in-memory), `track` (consent- and
  event-gated), dev console sink + `NEXT_PUBLIC_ANALYTICS_URL` `sendBeacon` seam, `deviceClass()`.
- **ANALYTICS consent** — `consentInputSchema.analytics` (optional), `ContactStep` checkbox (not
  pre-checked, with the "no registramos teléfono/correo/fotos/descripción" note), `attachContact`
  writes the 4th `Consent` row, `Assistant.finish` calls `setAnalyticsConsent` + `track`. Funnel
  events: `category_selected`, `analysis_completed`/`analysis_failed`, `validation_shown`,
  `validation_corrected`, `request_submitted`.
- **`src/lib/seo.ts`** — `siteUrl`, `organizationLd`, `websiteLd`, `serviceLd`, `breadcrumbLd`,
  `faqPageLd`. **`src/ui/JsonLd.tsx`** — `application/ld+json` blocks (not CSP-affected).
- **SEO route files** — `src/app/{robots,sitemap,manifest}.ts`, `src/app/icon.tsx` (brand monogram
  via `next/og`).
- **`src/config/service-content.ts`** — `ServiceContent` per trade + `SERVICE_TRADES`.
  **`src/app/servicios/page.tsx`** (index) + **`src/app/servicios/[slug]/page.tsx`**
  (`generateStaticParams`, `dynamicParams=false`, `generateMetadata`, `notFound` for unknown slugs,
  `Service` + `BreadcrumbList` JSON-LD, CTA to `/solicitar`).
- **`src/app/cobertura/page.tsx`** + **`CoverageChecker.tsx`** (client, no PII, no network) +
  `cobertura.module.css`. D-013 wider-area rule in `checkCoverage` (`matchedBy: "area"` for any
  `46xxx`).
- **Landing** — `Organization`/`WebSite`/`FAQPage` JSON-LD; footer + section links to `/servicios`
  and `/cobertura`; coverage copy updated for D-013.
- **Coverage** — added Rafelbunyol, La Pobla de Farnals, El Puig de Santa Maria, Puçol, Sagunto/
  Puerto de Sagunto to the confirmed list, then the wider-area rule (D-013).
- **`src/proxy.ts`** — per-request CSP nonce (issue #29). **`next.config.ts`** — CSP removed.
  **`src/app/layout.tsx`** — `force-dynamic`.

## Verification (TP-15)
200/200 tests (was 183: +9 analytics, +6 proxy, +2 coverage); lint / typecheck / `npx next build`
clean. `curl` of `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/icon`, `/servicios/*`,
`/cobertura`, unknown slug → 404. JSON-LD blobs inspected. Browser (`npm run start`, `localhost:3210`):
service page renders; `/cobertura` checker with PC 46900 → "damos servicio en toda el área de
Valencia" + CTA; `/solicitar` hydrates past the spinner and advances to triage; console clean.

## Lessons
- **L-004** — a strict `script-src 'self'` CSP with no nonce breaks Next 16 App Router hydration
  site-wide, and `curl -D -` (headers only) does not catch it. A browser drive of an interactive
  page is mandatory when touching CSP. Recorded in `docs/lessons-learned.md`.

## Close-out
`develop` → `main` merge (user-authorised per sprint, `--no-ff`, push). Beat-1 comment on #18 and #29.
