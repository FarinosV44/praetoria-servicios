---
schema: keel.sprint/1
sprint: 5
goal: The client assistant flow end to end — intent, triage, photos, analysis, validation, contact (issues #5, #7, #8, #10)
status: done
slices:
  - id: S-026
    title: Safety triage config + tests (benchmark D2)
    status: done
    hours: 0.75
    depends_on: []
    criteria: [AC-5-triage]
  - id: S-027
    title: analysisService — mock adapter, schema validation, versioned + active
    status: done
    hours: 1.5
    depends_on: []
    criteria: [AC-7-schema, AC-7-persist, AC-8-history]
  - id: S-028
    title: assistant server actions (analyze, correction, finish)
    status: done
    hours: 1
    depends_on: [S-027]
    criteria: [AC-8-complete-on-failure]
  - id: S-029
    title: Assistant wizard (9 steps) + local draft recovery
    status: done
    hours: 2.5
    depends_on: [S-026, S-028]
    criteria: [AC-5-onehand, AC-5-recover, AC-5-keyboard, AC-10-noaccount]
  - id: S-030
    title: AnalysisPanel + ContactStep + TradeCards
    status: done
    hours: 1.5
    depends_on: [S-029]
    criteria: [AC-10-consent, AC-10-privacy]
---

# Sprint 5 — Client assistant flow (#5, #7, #8, #10)

Steps: intent → safety triage → category (+ "no sé") → photos → explanation + location →
AI analysis → validation/correction → contact + consent → done.

- Issue #5 acceptance:
  - [x] Funciona con una mano en móvil — single column, 44px targets, prose-width
  - [x] Cada paso valida solo lo imprescindible
  - [x] "No sé qué profesional necesito" es opción principal (first, distinct)
  - [x] Recargar recupera el borrador — `localStorage` (`draft-storage.ts`), 3-day TTL
  - [x] Estados de error, carga y reintento — every step
  - [x] Accesible por teclado y lector de pantalla — real buttons, focus moves to step heading, fieldsets/legends
- Issue #7 acceptance:
  - [x] Con información insuficiente pide datos concretos — `NEEDS_MORE_INFO` + `missingInfo`
  - [x] Nunca "diagnóstico definitivo" — "orientativo" copy everywhere
  - [x] Clasifica el oficio aunque el usuario eligiera "No sé" — mock heuristic + `clientChoseUnsure`
  - [x] Fallos del proveedor → reintento o revisión manual — `PROVIDER_ERROR` path
  - [x] Adaptador simulado — `createMockAiAnalyzer` (deterministic)
  - [x] Salida persistida estructurada — `AnalysisVersion.result` (Json), schema-validated
- Issue #8 acceptance:
  - [x] Nunca se pierde la versión anterior — versioned rows, one `isActive`
  - [x] El admin puede consultar historial — `analysisService.history`
  - [x] Distingue hechos / inferencias / dudas — AnalysisPanel sections + `missingInfo`
  - [x] Se puede completar el envío aunque la IA falle — `PROVIDER_ERROR` → "que lo revise una persona" → submit
  - [x] Confirmación explícita de la versión final — "Sí, es correcto" → `VALIDADA_CLIENTE`
- Issue #10 acceptance:
  - [x] Marketing nunca premarcado — unchecked by default
  - [x] Solicitud creada una sola vez — `submit()` idempotent
  - [x] Datos inválidos → mensajes específicos — Zod field errors surfaced
  - [x] Confirmación por el canal disponible — recorded; email/WA send is issue #13
  - [x] Política de privacidad enlazada antes del envío — link in the handling consent
- Verification (TP-6): 4 triage unit + 4 analysis integration tests (67 total green). **Full browser
  walkthrough**: intent → triage → Fontanería → skip photos → describe (fuga bajo el fregadero,
  Valencia 46007) → AI classified `fontaneria`, urgency Media, orientative → "Sí, es correcto" →
  contact (Prueba E2E, +34600111222, WhatsApp, handling consent) → **"Solicitud recibida"
  PS-2PTJ-46H9**. DB: status VALIDADA_CLIENTE, trade fontaneria, withinCoverage true, phone
  normalised, 3 consents, 1 analysis, history BORRADOR→PENDIENTE_ANALISIS→VALIDADA_CLIENTE. No
  console errors.
