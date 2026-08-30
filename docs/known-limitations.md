# Known limitations & post-v1 backlog

The MVP (issues #1–#19) is functionally complete and verified. This is the honest list of what it
does **not** do yet, so nobody is surprised in production and the next phase has a starting point.
Nothing here is a defect — each is a conscious v1 boundary (many recorded in `docs/decisions.md`).

## Providers running in mock/dev mode

The product is fully runnable and testable with deterministic mock adapters (D-008). Before real
use these need wiring (env only, no code change):

| Capability | v1 state | To enable |
|---|---|---|
| AI analysis | deterministic mock (`AI_ADAPTER=mock`) | `AI_ADAPTER=claude` + `ANTHROPIC_API_KEY` |
| OCR (insurance policies) | mock (`OCR_ADAPTER=mock`) | pick Tesseract or a cloud OCR, set `OCR_ADAPTER` + keys |
| Email | console log (`EMAIL_ADAPTER=console`) | `EMAIL_ADAPTER=smtp` + `SMTP_URL` + `EMAIL_FROM` |
| WhatsApp | pre-filled `wa.me` deep link only | a Business API provider behind the existing adapter seam |
| Blob storage | local filesystem (`STORAGE_ADAPTER=fs`) | `s3` + `S3_*` for multi-instance / durability |
| Analytics | server-log sink | `NEXT_PUBLIC_ANALYTICS_URL` → a Plausible/GA-style collector |
| Error tracking | structured `error` log lines | add `ERROR_SINK_URL` + a `fetch` in `observability.ts#reportError` |

## Functional boundaries

- **Audio input in the assistant (#5)** — the UI affordance is prepared; capture/transcription is
  not implemented. Text + photos only in v1.
- **In-assistant insurance upload (#14) and coverage trigger (#15)** — the `/s/[token]` client
  section + the admin panels cover the acceptance criteria. A dedicated in-wizard "seguro" step is a
  follow-up.
- **Single locale (es-ES)** — copy is centralised in `src/config/copy` so a second locale is an
  addition, not a rewrite, but there is no i18n framework (D-006).
- **Coverage is "toda el área de Valencia"** (D-013) — any `46xxx` postcode is treated as in-area,
  with availability confirmed at quote time. The confirmed-municipality list is a subset shown as
  examples. There are **no per-municipality landing pages** (D10 — honest local SEO).
- **`landing_cta_click`** analytics event does not fire from the landing (a server component with
  no consent yet on a first visit). Every in-assistant funnel event does fire, once consented.
- **Legal texts are provisional** — `/legal/*` carry a "pendiente de revisión jurídica" banner and
  are `noindex`. Definitive texts + a full DPIA are a release gate (not done).
- **Admin auth** is a minimal signed-cookie session (D-012): one shared credentials login, no SSO,
  no MFA, no self-service recovery, no per-user roles.
- **Rate-limit store is in-process** — fine for a single instance; needs Redis (or equivalent) if
  the app is scaled horizontally.
- **Scheduled work runs via one HTTP cron endpoint** (`/api/cron/retention`) — no dedicated worker /
  queue infrastructure.

## Rendering / performance

- **Every route is server-rendered** (`force-dynamic`, D-014) — required so the per-request CSP
  nonce reaches Next's hydration scripts (issue #29). No static prerendering or CDN HTML caching in
  v1. Revisit with ISR or Next's experimental hash-based CSP if page latency becomes a concern.
- **Hero / Open Graph image** for the landing is not designed (#4) — the generated `/icon` monogram
  is the only brand image asset.

## Testing coverage

- **E2E (`npm run test:e2e`, Playwright)** covers, on desktop **and** a Pixel 5 mobile viewport:
  the full request flow (flow 1), the "needs more info" branch (flow 2), admin login + list, signed-
  link and admin-route authorization deny paths, the SEO endpoints, and an axe accessibility audit
  of 5 key pages. It needs `npx playwright install chromium` once and a running production build.
- **Flows 3 / 5 / 6** from issue #19 (AI hard failure, unreadable policy, doubtful coverage) are
  covered by integration tests (TP-4, TP-11, TP-12), not E2E — the mock AI never errors and the
  branches are pure server logic. Add them to the E2E suite when a real AI provider is wired.
- **The guided assistive-technology pass** (screen reader, full keyboard walk) is run with the user
  per `references/accessibility.md` — the automated axe pass is the machine half only.
- **Manual device checklist** — see below; a human runs it once before go-live.

## Manual pre-launch checklist (device / browser)

Run once against the preview environment. Not automatable (real devices, real assistive tech).

- [ ] iOS Safari (a recent iPhone) — assistant flow 1 end to end, photo picker, `/cobertura` checker.
- [ ] Android Chrome — same.
- [ ] Desktop Chrome, Firefox, Safari — landing, assistant, admin login.
- [ ] VoiceOver (iOS) or TalkBack (Android) — the assistant is announced and operable step by step.
- [ ] Full keyboard, no mouse — every control on `/`, `/solicitar`, `/servicios/*`, `/cobertura`,
      `/admin` is reachable, focus is visible, order is sane, the contrast table scrolls with the keyboard.
- [ ] 200% browser zoom / large system text — nothing clipped or overlapping.
- [ ] `prefers-reduced-motion` on — no non-essential animation.
- [ ] Slow 3G throttle — the assistant is usable; the analysis spinner resolves or degrades.
- [ ] Real email + WhatsApp round trip once the providers are wired.

## Post-v1 backlog (issues #20–#27)

Growth features, to be built in the order agreed with the operator
(#22 → #21 → #23 → #24 → #25 → #26 → #20 → #27):

- **#22** verified professional network + assignment
- **#21** "Carta de Confianza Praetoria" + transparency surface
- **#23** service close-out, warranty, post-work incidents
- **#24** editorial CMS for guides / posts
- **#25** SEO architecture for services × problems × municipalities (built on real content only)
- **#26** verified reviews + local reputation
- **#20** professional-recruitment landing page
- **#27** local-SEO control centre + content-opportunity tracking

## Also tracked

- Benchmark #28 follow-ups: walk 5 live competitor request forms (D8), and the 100-individual-review
  manual pass by the 2027-03-01 review date.
- ER diagram of the request model (Phase 6 documentation).
- Wire `safeFetch` into the first real outbound provider call.
