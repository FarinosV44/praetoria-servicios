---
schema: keel.sprint/1
sprint: 22
goal: Professional recruitment landing — public application form + separate admin inbox, no portal, no auto-assignment, no professional login (issue #20)
status: done
slices:
  - id: S-128
    title: "domain: professionals/application.ts — normalise, fingerprint (idempotency/dedup), status machine (NUEVA→CONTACTADA→EN_VALIDACION→APROBADA/RECHAZADA), spam/honeypot heuristics — test-first"
    status: done
    hours: 2
    depends_on: []
    criteria: [AC-20-antispam, AC-20-inadmin]
  - id: S-129
    title: "schema: ProfessionalApplication + ProfessionalApplicationStatus enum + migration"
    status: done
    hours: 1
    depends_on: [S-128]
    criteria: [AC-20-inadmin]
  - id: S-130
    title: "applicationService: submit (spam gate + fingerprint dedup), listForAdmin, setStatus, addNote, convertToProfessional — integration tests"
    status: done
    hours: 1.5
    depends_on: [S-129]
    criteria: [AC-20-antispam, AC-20-inadmin, AC-20-noaccess]
  - id: S-131
    title: "action submitProfessionalApplicationAction — zod + honeypot + IP rate-limit + idempotency"
    status: done
    hours: 1
    depends_on: [S-130]
    criteria: [AC-20-antispam]
  - id: S-132
    title: "public /trabaja-con-nosotros — application form, secondary styling, linked from footer only (does not compete with the client CTA); robots + sitemap"
    status: done
    hours: 2
    depends_on: [S-131]
    criteria: [AC-20-nodistract, AC-20-novolume]
  - id: S-133
    title: "admin /admin/candidaturas — separate inbox, status filter, internal notes, convert-to-professional; nav link"
    status: done
    hours: 1.5
    depends_on: [S-130]
    criteria: [AC-20-inadmin]
  - id: S-134
    title: "verify — tests, build, HTTP checks, E2E; sprint close"
    status: done
    hours: 1
    depends_on: [S-128, S-129, S-130, S-131, S-132, S-133]
    criteria: [AC-20-nodistract, AC-20-novolume, AC-20-inadmin, AC-20-antispam, AC-20-noaccess]
---

# Sprint 22 — Professional recruitment landing (issue #20)

## Acceptance criteria (issue #20)
- [x] AC-20-nodistract — the page does not distract from the main client CTA.
- [x] AC-20-novolume — no promise of a minimum volume of work.
- [x] AC-20-inadmin — a submission shows up in administration.
- [x] AC-20-antispam — antispam protection and idempotency.
- [x] AC-20-noaccess — no professional access to the system in this MVP.

## Design
- **`ProfessionalApplication` is separate from the `Professional` network (#22).** The public form
  captures a raw application with its own small status (`NUEVA / CONTACTADA / EN_VALIDACION /
  APROBADA / RECHAZADA` — the issue's wording) + internal notes. Converting an APROBADA application
  creates a `Professional` in `CANDIDATO` (via `professionalService`) and links it. This keeps
  first-contact intake decoupled from the verified-network lifecycle and its state machine.
- **No sensitive docs at first contact** (issue rule). File upload is deliberately NOT part of v1 —
  recorded as deferred. The `storage` adapter exists; a later slice can add optional attachments.
- **Antispam**: a honeypot field (`website`, must stay empty), an IP rate-limit
  (`RATE_LIMITS.application`), and fingerprint dedup — a second submission with the same
  email+phone+trades inside 30 days is a no-op that still returns success (no enumeration).
- **The page does not compete with the client CTA**: its own route `/trabaja-con-nosotros`, linked
  only from the footer, secondary visual treatment, copy that is about *the work*, not *the volume*.
- **No professional login** — there is no auth, no portal, no dashboard for professionals in this MVP.
