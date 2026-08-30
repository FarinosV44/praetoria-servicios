---
schema: keel.sprint/1
sprint: 19
goal: Editorial CMS — block-based content, admin publish without deploy, public /guias (issue #24)
status: done
slices:
  - id: S-108
    title: "domain: slug helper, article status machine, block-content Zod schema, quality warnings (test-first)"
    status: done
    hours: 2
    depends_on: []
    criteria: [AC-24-nodup, AC-24-schema]
  - id: S-109
    title: "schema: Article, ArticleRevision, SlugRedirect + ArticleStatus/ArticleKind enums + migration; src/config/content.ts"
    status: done
    hours: 1
    depends_on: [S-108]
    criteria: [AC-24-history]
  - id: S-110
    title: "contentService: create/update(+revision)/setStatus(guards: human review, no dup slug, schedule)/restoreRevision/publishDue/getBySlug/listPublished + slug-change 301 (integration tests)"
    status: done
    hours: 2.5
    depends_on: [S-109]
    criteria: [AC-24-crud, AC-24-history, AC-24-nodup, AC-24-humanreview]
  - id: S-111
    title: "admin: /admin/contenido list + /admin/contenido/[id] editor (blocks JSON + SEO fields + warnings panel + revision history/restore + preview link)"
    status: done
    hours: 3
    depends_on: [S-110]
    criteria: [AC-24-crud, AC-24-preview, AC-24-history]
  - id: S-112
    title: "public: BlockRenderer, /guias index + /guias/[slug] (semantic HTML, breadcrumbs, ToC, CTA, Article JSON-LD, generateMetadata, noindex honored), 301 redirects, sitemap"
    status: done
    hours: 2.5
    depends_on: [S-110]
    criteria: [AC-24-render, AC-24-sitemap, AC-24-schema, AC-24-preview]
  - id: S-113
    title: "cron: contentService.publishDue in the retention job"
    status: done
    hours: 0.3
    depends_on: [S-110]
    criteria: [AC-24-crud]
  - id: S-114
    title: "verify — tests, build, E2E"
    status: done
    hours: 1
    depends_on: [S-108, S-109, S-110, S-111, S-112, S-113]
    criteria: [AC-24-crud, AC-24-preview, AC-24-history, AC-24-sitemap, AC-24-schema, AC-24-nodup, AC-24-render]
---

# Sprint 19 — Editorial CMS (issue #24)

## Acceptance criteria (issue #24)
- [ ] AC-24-crud — an admin creates, reviews, schedules, publishes and updates content without a deploy.
- [ ] AC-24-preview — the preview is identical to the public result (same `BlockRenderer`).
- [ ] AC-24-history — revision history + restore.
- [ ] AC-24-sitemap — the sitemap updates automatically with published articles.
- [ ] AC-24-schema — `Article` JSON-LD only carries visible, real information.
- [ ] AC-24-nodup — duplicate published slugs are impossible.
- [ ] AC-24-render — published content is accessible and does not break the layout (semantic
  server-rendered HTML, block model — no raw HTML injection).
- [ ] AC-24-humanreview — content is not published without a human-review flag.

## Design decision
The issue asks for **block-based** content. We store the body as a validated JSON array of typed
blocks (`heading`, `text`, `list`, `quote`, `cta`, `table`, `image`, `notice`, `faq`) and render it
with one server component. This makes "preview identical to public" trivial and removes any raw-HTML
injection surface. A richer editing UX (drag-drop block editor) is a later refinement; v1 edits the
block JSON + structured SEO fields in a form. The full local-SEO architecture (services × problems ×
municipalities) is issue #25.

## AC status
- [x] AC-24-crud — an admin creates (`/admin/contenido`), edits (`[id]` editor), schedules
  (PROGRAMADO + `publishAt`), publishes and updates — no deploy. Cron `publishDue` promotes
  scheduled articles.
- [x] AC-24-preview — `/admin/contenido/[id]/preview` renders with the **same `BlockRenderer`** as
  `/guias/[slug]`.
- [x] AC-24-history — every save / status change / restore snapshots an `ArticleRevision`; the
  editor lists them with a "Restaurar" button (`restoreRevision`).
- [x] AC-24-sitemap — `sitemap.ts` is now async and appends every PUBLICADO, non-noindex article
  (`contentService.publishedSlugs`); it updates automatically.
- [x] AC-24-schema — `articleLd` (`src/lib/seo.ts`) emits only visible, real fields; author only
  when set, dates only when present, no ratings.
- [x] AC-24-nodup — `slug` is `@unique`; `update` rejects a slug already used by another article
  (`slug_taken`); `content.test.ts` proves it.
- [x] AC-24-render — server-rendered semantic HTML from the block model; no `dangerouslySetInnerHTML`;
  breadcrumbs + ToC (≥3 headings) + contextual CTA; the axe pass already covers layout/a11y.
- [x] AC-24-humanreview — `validateArticleTransition` blocks PUBLICADO / PROGRAMADO unless
  `reviewedByHuman`; `content.test.ts` "cannot publish without a human review, then can".
- 301 redirects: changing a published article's slug writes a `SlugRedirect`; `/guias/[slug]` does
  `permanentRedirect`.

## What was built
- **`src/domain/content/`** (+13 tests, test-first): `slug.ts` (`toSlug`, `isValidSlug`),
  `article-status.ts` (5-state machine + human-review + future-date gates), `blocks.ts` (Zod
  discriminated union of 9 block types + `headingsOf` / `faqItemsOf` / `imagesOf`), `quality.ts`
  (`articleWarnings` — duplicate title/slug, missing author/meta, images without alt).
- **Schema** (migration `20260830230038_editorial_cms`): `Article`, `ArticleRevision`,
  `SlugRedirect` + `ArticleStatus` / `ArticleKind` enums. `src/config/content.ts`.
- **`contentService`** (+8 integration tests): create, update (+ revision snapshot + slug‑change
  301), setReviewedByHuman, setStatus (guarded), restoreRevision, publishDue (cron), warningsFor,
  listForAdmin / getForAdmin, listPublished, resolvePublic (article | redirect | none), publishedSlugs.
- **Admin**: `/admin/contenido` (list + `NewArticleForm`), `/admin/contenido/[id]` (`ArticleEditor`
  — content + cover + SEO + internal notes; status controls; reviewed toggle; quality warnings
  panel; revision history + restore; preview link), `/admin/contenido/[id]/preview`. Nav link.
- **Public**: `src/ui/content/BlockRenderer.tsx` (safe inline parser, no raw HTML), `/guias`
  (index) + `/guias/[slug]` (Article + BreadcrumbList + FAQPage JSON-LD, `generateMetadata`,
  noindex honoured, `permanentRedirect` on a moved slug). `sitemap.ts` + `robots.ts` updated.
- **Cron**: `contentService.publishDue` in `/api/cron/retention`.

## Lesson
- **L-006** — `setF((p) => ({ ...p, [k]: e.currentTarget.value }))` reads `e.currentTarget` inside
  the deferred state updater, which React has already nulled by then → the editor crashed under
  fast form input (caught by the E2E, not a unit test). Fixed by capturing `e.currentTarget.value`
  into a local before `setF`. Recorded in `docs/lessons-learned.md`.

## Verification (TP-20)
282 vitest (+21); lint / typecheck / `npx next build` clean. E2E: **37 pass, 5 skipped, 0 failed**
across both projects (run one project at a time — this machine OOMs `next start` + two chromium
workers; `e2e-status.json` result:pass). New: `/guias` smoke + the CMS editor create→edit→save walk.

## Close-out
`develop` → `main` merge (user-authorised per sprint, `--no-ff`, push). Beat-1 comment on #24.
