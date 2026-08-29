# 01 — Discovery (condensed)

Discovery for this project is supplied by the client as **27 GitHub issues**, with issue #1 as the
EPIC. This document records the shape of the product and the closed decisions; it does not
re-derive requirements the issues already state.

## Product

Praetoria Servicios is a mobile-first Spanish web application for the Valencia area (Valencia city +
northern metropolitan municipalities). A resident describes a home problem in plain language with
photos; AI turns it into a technical brief and proposes an orientative solution and the right trade;
the user validates or corrects; Praetoria responds within 24 working hours with a quote and a
timeframe. An optional branch lets the user upload their home-insurance policy and receive an
orientative coverage analysis plus a reviewable legal draft.

## Value proposition (from EPIC #1)

1. The user does not need to know which professional they need.
2. They attach photos and explain the problem in their own words.
3. AI interprets the case, proposes an orientative solution, determines the trade.
4. The user validates or extends the information.
5. Praetoria replies in under 24 h with a quote and timeframe.
6. Optionally, the user uploads their policy and receives an orientative coverage analysis + a
   reviewable legal draft.

## MVP flow

`start → category / "I don't know" → photos → explanation → AI analysis → validation/correction →
contact → request created → admin review → quote → client communication`

Insurance branch: `request → upload policy → extraction → coverage analysis → draft communication →
human review`.

## Closed decisions (EPIC #1 — "Decisiones cerradas para evitar bloqueos")

- Mobile-first, Spanish.
- No mandatory client accounts. Client identified by name + phone or email.
- Quotes and professional assignment are manual, from the admin panel.
- No online payments in this phase.
- No professional portal in this phase.
- AI diagnosis is always presented as orientative.
- Insurance coverage is never asserted as guaranteed.
- WhatsApp MVP: prepared link/message or configurable provider — do not block launch on a final API.
- Transactional email via a configurable adapter.
- Every key and provider is configured via environment variables.

## Out of scope (v1)

Automatic marketplace, payments, invoicing, native app, automatic technician scheduling, public
ratings, full professional portal. (Issues #20–#27 add a controlled subset of reputation, network
and content features *after* the core flow — see docs/issues.md build order.)

## Project type & cross-cutting profiles

- Type: **web-app** → `references/security/web-app.md`.
- Accessibility: WCAG 2.2 AA floor, EN 301 549 / EAA (EU market) → `references/accessibility.md`.
- Known traps: `references/anti-patterns.md` (universal + web-app).

## Sensitive-data note

The product handles photos of people's homes, phone numbers, emails and — in the insurance branch —
full home-insurance policies. This raises the bar for storage privacy, access control, logging
hygiene and verified deletion from the first commit, not at issue #17. See docs/threat-model.md.

## Estimate

Not produced as a formal `docs/estimate.md` in this engagement (Client budget: no). Rough AI-time
order of magnitude for the MVP core (issues #1–#19): tens of AI working hours plus supervision,
spread across many sessions. Growth issues #20–#27 add a comparable amount again.
