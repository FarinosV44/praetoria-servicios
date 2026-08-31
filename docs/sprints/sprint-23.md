---
schema: keel.sprint/1
sprint: 23
goal: Local SEO control centre — CSV metrics import (no API), actionable opportunity/gap dashboard, organic→request attribution, PII-free, no causality claims (issue #27)
status: done
slices:
  - id: S-135
    title: "domain: seo/{metrics-csv,opportunities,linking-gaps,faq-suggestions}.ts — parse (PII-reject), low-CTR / striking-distance buckets, linking gaps from #25 data, cannibalization, stale content, FAQ candidates from anonymised request text — test-first"
    status: done
    hours: 3
    depends_on: []
    criteria: [AC-27-nopii, AC-27-csv, AC-27-datatype, AC-27-nocausality]
  - id: S-136
    title: "schema: SeoMetricImport + SeoMetricRow + migration; Request.entryPath / entryReferrerHost"
    status: done
    hours: 1
    depends_on: [S-135]
    criteria: [AC-27-period, AC-27-funnel]
  - id: S-137
    title: "seoService: importCsv (parse + PII-reject + store), overview (buckets + gaps + attribution), pagesWithTrafficNoRequests, draftFromQuery — integration tests"
    status: done
    hours: 2
    depends_on: [S-136]
    criteria: [AC-27-csv, AC-27-alertaction, AC-27-funnel]
  - id: S-138
    title: "entry-path capture: EntryTracker cookie (first-touch, path only) on marketing pages; createDraftAction reads it → Request.entryPath"
    status: done
    hours: 1
    depends_on: [S-136]
    criteria: [AC-27-funnel, AC-27-nopii]
  - id: S-139
    title: "admin /admin/seo — CSV import form, opportunity/gap/attribution/stale/cannibalization sections, período+fuente+tipo labels, 'crear borrador desde consulta', no causality copy; nav link"
    status: done
    hours: 2.5
    depends_on: [S-137]
    criteria: [AC-27-period, AC-27-datatype, AC-27-alertaction, AC-27-nocausality]
  - id: S-140
    title: "verify — tests, build, HTTP checks, E2E; sprint close; growth backlog now empty"
    status: done
    hours: 1
    depends_on: [S-135, S-136, S-137, S-138, S-139]
    criteria: [AC-27-nopii, AC-27-period, AC-27-datatype, AC-27-csv, AC-27-alertaction, AC-27-funnel, AC-27-nocausality]
---

# Sprint 23 — Local SEO control centre (issue #27)

## Acceptance criteria (issue #27)
- [x] AC-27-nopii — no query or event contains PII.
- [x] AC-27-period — every metric states its period and source.
- [x] AC-27-datatype — the system distinguishes real data, estimate, and recommendation.
- [x] AC-27-csv — a CSV mode exists when no integration is configured.
- [x] AC-27-alertaction — every alert leads to a concrete action.
- [x] AC-27-funnel — measured from organic entry through validated request to accepted quote.
- [x] AC-27-nocausality — the panel never claims causality or a ranking improvement without evidence.

## Design
- **No real Google Search Console / analytics API** (providers are env-only, D-008). The
  always-available path is **CSV import** (`seo/metrics-csv.ts`): the admin pastes/uploads a GSC-style
  export; the parser maps headers (EN + ES), coerces numbers, and **rejects any row whose `query`
  looks like PII** (`detectPii` from the reputation domain), reporting the skipped count.
- **Everything shown carries `period` + `source` + a `kind` of `real | estimate | recommendation`.**
  Real = a stored metric row. Estimate = something derived (e.g. expected CTR at a position).
  Recommendation = an opportunity/gap the panel proposes. The dashboard never says a change *caused*
  a ranking move.
- **Local signals need no import**: internal-linking gaps come from #25's data — a curated problem
  whose trade has no `/servicios/[slug]`, a `/zonas` page published but not indexable (with the D10
  reasons), an `Article` with no internal links. Cannibalization + stale content come from the
  `Article` set. FAQ candidates come from request `problemText`, **anonymised** (`redactPii`) and
  grouped by trade.
- **Attribution**: a first-party `praetoria_entry` cookie (pathname only, first-touch, no query
  string) written by `EntryTracker` on marketing pages; `createDraftAction` copies it to
  `Request.entryPath`. That plus the existing quote lifecycle gives organic-entry → validated
  request → accepted quote. If a page has imported traffic but zero `entryPath` requests, it is
  flagged "tráfico sin solicitudes".
- **Editorial**: "crear borrador desde una consulta" calls `contentService.create` prefilled and
  opens the editor. Internal-link proposals are shown for the admin to apply — never auto-applied.
  AI content is never auto-published (the #24 human-review gate already enforces this).
