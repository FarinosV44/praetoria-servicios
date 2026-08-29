---
schema: keel.sprint/1
sprint: 4
goal: Photo capture, upload and secure storage (issue #6)
status: done
slices:
  - id: S-021
    title: Magic-byte image validation (pure, test-first)
    status: done
    hours: 0.75
    depends_on: []
    criteria: [AC-6-noexec, AC-6-limits]
  - id: S-022
    title: Minimal rate limiter (token bucket, test-first)
    status: done
    hours: 0.5
    depends_on: []
    criteria: []
  - id: S-023
    title: photoService — store key only, signed URLs, lifecycle deletion
    status: done
    hours: 1.25
    depends_on: [S-021]
    criteria: [AC-6-private, AC-6-lifecycle]
  - id: S-024
    title: POST /api/uploads (origin check, rate limit, one file)
    status: done
    hours: 1
    depends_on: [S-023]
    criteria: [AC-6-onefail]
  - id: S-025
    title: Client image prep (EXIF orientation + downscale) + PhotoUpload component
    status: done
    hours: 1.25
    depends_on: [S-024]
    criteria: [AC-6-mobile, AC-6-quality]
---

# Sprint 4 — Photos (issue #6)

- Acceptance (issue #6) — all met and functionally verified:
  - [x] No se aceptan formatos ejecutables disfrazados de imagen — magic-byte sniff; MZ/ELF → 422
  - [x] Una subida fallida no obliga a repetir las demás — one-at-a-time XHR, per-file retry
  - [x] Las fotos no son públicas ni indexables — stored under `.storage/` (outside `public/`),
    served only via HMAC-signed, expiring URLs with `Cache-Control: private, no-store`
  - [x] Rendimiento aceptable con red móvil lenta — client downscale to 2000px @ q0.82
  - [x] Las imágenes conservan calidad suficiente para análisis — 2000px is plenty for the model
  - [x] Límites configurables y mensajes comprensibles — `src/config/limits.ts`, Spanish messages
- Verification (TP-5): 12 unit tests (validation 7, rate-limit 3, ... ) + 5 photo integration tests;
  live curl: valid JPEG → 201 + file in `.storage/`; executable → 422; missing Origin → 403;
  valid signed URL → 200 (22 bytes); tampered signature → 403.
- Close-out: also added `src/lib/rate-limit.ts` (issue #17 can swap the store) and `src/lib/http.ts`
  (origin check). `deleteExpiredDrafts` now purges photo blobs too.
