# Benchmark de competencia — Praetoria Servicios

> Issue #28. Investigación acotada previa al cierre de identidad (#3), landing (#4), asistente (#5),
> confianza (#21), profesionales (#22), SEO (#25) y reseñas (#26).
> **No es una excusa para retrasar la implementación.** El objetivo es convertir hallazgos en
> decisiones concretas.

## 0. Estado y fecha de revisión

- **Fecha de la investigación:** 29 de agosto de 2026.
- **Autor:** sesión de desarrollo (Claude Code, workflow Keel).
- **Zona analizada:** Valencia ciudad y municipios del norte del área metropolitana realmente
  atendidos según `src/config/coverage.ts` (Burjassot, Godella, Rocafort, Moncada, Alfara del
  Patriarca, Vinalesa, Foios, Meliana, Almàssera, Tavernes Blanques, Bonrepòs i Mirambell,
  Paterna, Alboraya) — más El Puig, Puçol, Massamagrell y Sagunto citados en #28 como referencia de
  zona norte extendida.
- **Fecha de revisión futura:** **1 de marzo de 2027** (o antes si se detecta un cambio relevante de
  un competidor). Registrada también en `docs/PROGRESS.md`.
- **Nivel de completitud declarado honestamente (ver §2):** cumple el grueso de los criterios de
  aceptación; dos quedan parcialmente cubiertos y con un plan concreto de cierre.

---

## 1. Resumen ejecutivo

El mercado de servicios para el hogar en la zona se reparte en cuatro modelos, y **ninguno cubre
bien el problema central de Praetoria**: *"tengo un problema en casa, no sé a quién llamar, y no
quiero que me persigan cuatro comerciales"*.

1. **Marketplaces de leads** (Habitissimo, Cronoshare, Zaask, Wolly, Webel). El usuario rellena un
   formulario y su solicitud se **vende hasta a 4 profesionales** que le llaman. El cliente hace de
   seleccionador y de central de llamadas. El profesional paga por lead (5–50 €) o suscripción
   (24–90 €/mes), lo que crea un incentivo estructural a la presión comercial. Trustpilot:
   Habitissimo **3,5/5 con 22 % de 1★** (más de 4.700 reseñas); Cronoshare **4,7/5** del lado
   cliente pero con quejas recurrentes de profesionales por leads de baja calidad.
2. **Operadores de confianza / seguros** (HomeServe, Reparalia). Interlocutor único y **garantía de
   1 año**, pero con modelo de **suscripción de renovación automática** que concentra las quejas:
   HomeServe **2,9/5 con 28 % de 1★** — cambios de tarifa sin aviso, cancelaciones que "desaparecen",
   técnicos que no aparecen, esperas de meses en urgencias.
3. **Empresas locales de manitas** (El Manitas Ideal, Manitas en Valencia, Reformas Claiz,
   Multiservicios Valencia). Interlocutor único y buenas reseñas locales (El Manitas Ideal:
   22 reseñas Google, media 5/5), pero **contacto por teléfono/WhatsApp sin poder adjuntar fotos**,
   sin estados, y con **cuota de visita/diagnóstico** (p. ej. 35 € en Manitas en Valencia) que
   muchas veces se comunica tarde.
4. **Apps internacionales de diagnóstico** (Thumbtack AI, Angi AI Helper, Frontdoor, Toolbox
   Repair). Referencias de UX en interpretación del problema con foto y lenguaje natural, pero
   **Thumbtack y Angi asumen que ya sabes qué hay que hacer** y funcionan como plataformas de
   reserva, no de diagnóstico; Frontdoor resuelve por videollamada con experto (149 $/año) pero es
   modelo de suscripción y mercado EE. UU.

**Oportunidad de Praetoria:** ser el **servicio gestionado con un único interlocutor** que
(a) interpreta el problema con fotos antes de asignar a nadie, (b) no vende la solicitud,
(c) entrega un presupuesto escrito y comparable consigo mismo con desplazamiento, extras e impuestos
por delante, y (d) revisa opcionalmente el seguro antes de que el cliente pague — una ventaja que
**ningún competidor local cubre**.

**Riesgo principal:** prometer rapidez, cobertura o garantía que todavía no se pueden sostener
operativamente. La diferenciación debe apoyarse en *proceso e información escrita*, no en cifras.

---

## 2. Metodología, fuentes y nivel de evidencia

### Fuentes consultadas (con fecha de acceso: 29-ago-2026)

| Tipo | Fuentes |
|---|---|
| Webs y centros de ayuda | habitissimo.es (+ soporte.habitissimo.com), cronoshare.com (+ atención al cliente), zaask.es (+ zendesk), wollyhome.com, homeserve.es (+ FAQs), reparalia.es, manitasenvalencia.com, elmanitasideal.es, reformasclaiz.es |
| Reseñas agregadas | Trustpilot ES (habitissimo, cronoshare, homeserve, reparalia), Google Business Profile (El Manitas Ideal), GoWork, Shopping-Satisfaction |
| Reclamaciones públicas | OCU (reclamaciones públicas: SegurCaixa Adeslas asistencia hogar 16-ago-2026; Pelayo daños por agua 17-mar-2026) |
| Foros / comunidad | denuncioestafa.com, estafas.de, Rankia (Reparalia), mundodvd |
| Referencias internacionales | Fast Company (Thumbtack AI), Angi press (AI Helper), Frontdoor.com + tiendas de apps, HomeMD.ai (comparativa AI 2026), Toolbox Repair |
| Sector seguros | fuga-agua.es, peritojudicial.com, arvaltec.com, OCU — sobre denegación de coberturas por "falta de mantenimiento" y proceso de tercer perito / Defensor del Asegurado / DGSFP |

### Criterios de aceptación de #28 — estado honesto

| Criterio | Estado | Nota |
|---|---|---|
| ≥10 competidores, incluidos 5 locales | ✅ | 11 plataformas/operadores + 4 empresas locales con identidad propia + 2 canales informales (Wallapop, Yoojo). Ver §3. |
| Recorrer ≥5 procesos de solicitud reales sin enviar datos falsos | ⚠️ parcial | Se han reconstruido los flujos de Habitissimo, Cronoshare, Zaask, Manitas en Valencia y Frontdoor desde su documentación pública y centros de ayuda, sin enviar datos. **Pendiente:** un recorrido navegado paso a paso de 5 formularios en vivo (sin enviar) con capturas — tarea acotada antes de cerrar #5. |
| Revisar ≥100 opiniones/comentarios agregados | ⚠️ parcial | Se han analizado las **distribuciones agregadas de Trustpilot de 3 plataformas (>13.000 reseñas) + ~30 reseñas individuales fechadas + reclamaciones OCU + hilos de foro**. **Pendiente:** un pase manual de 100 reseñas individuales clasificadas, para la fecha de revisión. |
| Cada patrón de queja con fuente, fecha y nivel de evidencia | ✅ | §6. |
| Tabla comparable con criterios homogéneos | ✅ | §3. |
| 10 decisiones concretas de producto | ✅ | §10. |
| Issues afectados actualizados o comentados | ✅ (al publicar) | §"Conversión en producto" y comentarios en #3 #4 #5 #21 #22 #25 #26. |
| Sin testimonios/métricas no verificadas incorporadas | ✅ | Toda cifra lleva fuente; lo no verificado se marca como tal. |
| Mejora la propuesta sin copiar | ✅ | §9 matriz; sin copiar textos, diseño ni código. |
| Fecha de revisión futura | ✅ | 1-mar-2027 (§0). |

**Escala de nivel de evidencia usada en §6:**
`Alto` = patrón visible en distribución agregada de reseñas + reclamaciones formales;
`Medio` = varias reseñas/hilos coincidentes con fecha;
`Bajo` = menciones aisladas o indicios.

---

## 3. Tabla comparativa (criterios homogéneos)

Leyenda: ✅ sí · ⚠️ parcial/condiciones · ❌ no · — sin dato público

### 3.1 Marketplaces de leads

| Criterio | Habitissimo | Cronoshare | Zaask | Wolly |
|---|---|---|---|---|
| Modelo | Marketplace de leads | Marketplace de leads | Marketplace de leads + pago online | Marketplace + "servicios verificados" |
| ¿Quién elige al profesional? | El cliente | El cliente | El cliente | El cliente |
| Nº profesionales que contactan | **Hasta 4** | **Hasta 4** | Varios (envían propuesta) | — |
| Adjuntar fotos al pedir | ⚠️ (texto; foto no destacada) | ⚠️ | ⚠️ | — |
| ¿Hace falta saber el oficio? | ✅ sí (eliges categoría) | ✅ sí | ✅ sí | ✅ sí |
| Coste para el profesional | Lead 10–50 € **o** suscripción 30–90 €/mes | Lead 5–40 € | Pago por oportunidad | Licencia ~24,5 €+IVA/mes |
| Comisión sobre el trabajo | ❌ no | ❌ no | ❌ no | ❌ no |
| Presupuesto | Cada profesional envía el suyo; el cliente compara | Íd. | Íd. (chat + pago in-app) | — |
| Visita de diagnóstico / coste | Depende del profesional | Depende | Depende | — |
| Verificación del profesional | ⚠️ perfil + opiniones; sin verificación de habilitación acreditada | ⚠️ | ⚠️ valoraciones | ✅ "verificados" (alcance no detallado) |
| Seguimiento / estados | ❌ | ❌ | ⚠️ chat | — |
| Garantía y responsable | ❌ (relación cliente–profesional) | ❌ | ❌ | — |
| Reseñas verificadas | ⚠️ opiniones de perfil | ⚠️ | ⚠️ | — |
| Trustpilot ES (29-ago-2026) | **3,5/5** · 4.728 reseñas · 51 % 5★ / **22 % 1★** | **4,7/5** · 4.420 reseñas · 86 % 5★ / 4 % 1★ | mixtas (sin muestra Trustpilot relevante ES) | — |

### 3.2 Operadores de confianza / seguros y empresas locales

| Criterio | HomeServe | Reparalia | El Manitas Ideal (Valencia) | Manitas en Valencia | Reformas Claiz / Multiservicios (VLC) |
|---|---|---|---|---|---|
| Modelo | Suscripción + packs complementarios al seguro | Red de asistencia de aseguradoras (Sabadell, Endesa…) | Empresa local, servicio directo | Empresa local, servicio directo | Empresa local, servicio directo |
| Interlocutor único | ✅ | ✅ (vía aseguradora) | ✅ | ✅ | ✅ |
| ¿Hace falta saber el oficio? | ❌ (describes el problema) | ❌ | ⚠️ (llamas y explicas) | ⚠️ | ⚠️ |
| Adjuntar fotos al pedir | ❌ (teléfono) | ❌ | ❌ (form: nombre, email, tel, dirección, mensaje) | ❌ | ❌ |
| Contacto | Teléfono 24/7 | Vía aseguradora | Teléfono / WhatsApp / email / form | Teléfono / WhatsApp / email / form | Teléfono / form |
| Coste de visita/diagnóstico | Incluido en pack | Según póliza | — | **35 € (a cuenta del trabajo)** | — |
| Presupuesto escrito antes de aceptar | ⚠️ (quejas de "todo por teléfono, sin contrato") | ⚠️ (quejas de baremos y facturas de terceros) | ⚠️ presupuesto tras contacto | ⚠️ "precio depende del trabajo" | ⚠️ |
| Garantía | ✅ **1 año** en reparaciones | ⚠️ (quejas de "sin garantía") | — | — | — |
| Seguimiento / estados | ⚠️ teléfono | ⚠️ | ❌ | ❌ | ❌ |
| Cobertura declarada | Nacional (>4.000 prof.) | Nacional (>2.600 prof.) | Valencia y alrededores | Valencia ciudad (30 años) | Valencia |
| Identidad empresarial visible | ✅ | ✅ | ✅ (dirección: c/ Colón 17, 46021) | ✅ (c/ Colón 17, 46021) | ✅ |
| Reseñas | Trustpilot **2,9/5** · 4.111 · **28 % 1★** | Trustpilot mixtas; OCU reclamaciones | **Google: 22 reseñas · 5/5** | — | — |
| Renovación automática / permanencia | ✅ auto-renueva (queja frecuente) | n/a | ❌ | ❌ | ❌ |

### 3.3 Referencias internacionales (UX, no competidores directos)

| Producto | Qué hace bien | Límite |
|---|---|---|
| **Thumbtack AI** (rediseño 2026) | El usuario describe lo que ve, sube fotos y responde preguntas a medida; la IA interpreta y propone profesionales que encajan | Asume que sabes qué hay que hacer; es plataforma de reserva, no de diagnóstico; EE. UU. |
| **Angi AI Helper** | LLM reformula la descripción del cliente a los términos que el profesional necesita; +~30 % de precisión de match vs formulario | Íd.: booking, no diagnóstico; EE. UU. |
| **Frontdoor** | Videollamada con experto (primera gratis) para diagnosticar y, si hace falta, lista de profesionales verificados | Suscripción 149 $/año; EE. UU.; no presupuesto escrito |
| **Toolbox Repair** | Diagnóstico por foto/vídeo/texto **clasificando cada problema por riesgo de seguridad** + pasos DIY o contacto con profesional | Orientado a DIY; no gestiona el trabajo ni el presupuesto |

---

## 4. Capturas / enlaces de recorridos relevantes

> Enlaces guardados (fecha de acceso 29-ago-2026). Las capturas paso a paso de formularios en vivo
> quedan como tarea acotada antes de cerrar #5 (ver §2 y §10-D8).

- Habitissimo — cómo funciona y "Pedir Presupuesto": <https://soporte.habitissimo.com/hc/es/articles/204309623>, <https://www.habitissimo.es/opiniones>
- Cronoshare — cómo funciona / "¿es un timo?": <https://www.cronoshare.com/atencion-cliente/es-un-timo-estafa-cronoshare>, <https://www.cronoshare.com/opiniones>
- Zaask — cómo funciona (cliente / profesional): <https://www.zaask.es/como-funciona>, <https://www.zaask.es/prestadores-de-servico>
- Wolly — comparativa de modelos: <https://www.wollyhome.com/blog/comparativa-definitiva-entre-plataformas-para-profesionales-habitissimo-webel-cronoshare-y-wolly>
- HomeServe — FAQs y home: <https://www.homeserve.es/faqs>, <https://www.homeserve.es/>
- Reparalia — Trustpilot: <https://es.trustpilot.com/review/reparalia.es>
- Manitas en Valencia — <https://manitasenvalencia.com/>
- El Manitas Ideal — <https://elmanitasideal.es/>
- Trustpilot: Habitissimo <https://es.trustpilot.com/review/habitissimo.es> · Cronoshare <https://es.trustpilot.com/review/cronoshare.com> · HomeServe <https://es.trustpilot.com/review/homeserve.es>
- OCU reclamaciones públicas: SegurCaixa Adeslas asistencia hogar (16-ago-2026), Pelayo daños por agua (17-mar-2026)
- Thumbtack AI — Fast Company (23-jun-2026, no accesible por bloqueo 403; resumen vía búsqueda) · Angi AI Helper — <https://www.angi.com/press/angi-ai-helper>
- Frontdoor — <https://www.frontdoor.com/> · Toolbox Repair — <https://toolbox.repair/best-home-repair-apps>

---

## 5. Fortalezas que merece la pena igualar

| # | Fortaleza observada | Dónde | Cómo la iguala Praetoria |
|---|---|---|---|
| F1 | **Respuesta rápida percibida** ("menos de 24 h", "me contactaron ayer y hoy resuelto") — es el elogio nº 1 de Cronoshare | Cronoshare (Trustpilot ago-2026) | Compromiso de respuesta <24 h laborables **con presupuesto y plazo**, configurable, sin fingir 24/7 (#4, #10) |
| F2 | **Interpretar el problema con foto + lenguaje natural** y hacer preguntas a medida | Thumbtack, Angi | Análisis multimodal (#7) + validación del cliente (#8) |
| F3 | **Clasificar por riesgo de seguridad** antes de nada | Toolbox Repair | Triaje de seguridad inmediato en el asistente (#5, refinamiento de comentario) |
| F4 | **Interlocutor único y garantía de 1 año** | HomeServe | Un solo interlocutor (#1, #21); garantía **solo cuando esté definida contractual y operativamente** (#23) |
| F5 | **Identidad local y reseñas reales** | El Manitas Ideal (Google 5/5) | Reseñas verificadas ligadas a trabajos reales (#26); identidad de empresa visible (#4, #21) |
| F6 | **Cobertura por zona explicada** | Empresas locales | Página de cobertura por municipio/CP configurable (#18, #25) — sin páginas locales vacías |
| F7 | **Perfil del profesional con fotos de trabajos y opiniones** | Habitissimo, Zaask | Ficha interna del profesional (#22); al cliente se le muestra identidad + alcance de verificación antes de la visita |

---

## 6. Fricciones y quejas repetidas (con fuente, fecha y nivel de evidencia)

| # | Patrón de queja | Dónde / fuente | Fecha | Nº aprox. de menciones | Evidencia | Implicación para Praetoria |
|---|---|---|---|---|---|---|
| Q1 | **"Cuatro profesionales me llaman" / exceso de llamadas tras pedir presupuesto** | Modelo declarado de Habitissimo/Cronoshare ("hasta 4"); foros denuncioestafa, estafas.de | 2012–2026 (patrón sostenido) | Estructural del modelo + decenas de hilos | **Alto** | Praetoria **no vende ni distribuye la solicitud**; un solo contacto (#1, #4, #21) |
| Q2 | **Leads vendidos a varios / de baja calidad; cobros por lead sin retorno** | Cronoshare (Trustpilot 1★ ago-2026: "de 10 leads, 1–2 útiles"); Habitissimo (1★ jul-2026: "15,33 € por 9 trabajos cobrados a diario") | 2026 | ~22 % de 1★ en Habitissimo; hilos de profesionales | **Alto** | El profesional recibe **solicitudes claras y filtradas**, no compradas a ciegas (#22 mensaje) |
| Q3 | **El profesional no aparece o llega tarde, sin avisar** | Habitissimo (1★ jul-2026: "el fontanero olvida el día… no aparece"); HomeServe (1★: "cita hoy, no apareció nadie, ni llamada"); Reparalia (impuntualidad) | 2026 | Múltiple en las tres | **Alto** | Confirmar identidad del profesional y franja antes de la visita (#21, #22); estados y SLA interno realista (#16, #23) |
| Q4 | **Precio final > presupuesto; extras no aprobados** | Habitissimo (1★ jun-2026: disputa de factura, trabajo incompleto); Reparalia ("cobran piezas desproporcionadas") | 2026 | Varias | **Medio-Alto** | Presupuesto con extras y procedimiento de aprobación documentada por delante (#12); "un presupuesto aceptado no se modifica en silencio" |
| Q5 | **Coste de desplazamiento / visita oculto o comunicado tarde** | Empresas locales (Manitas en Valencia: 35 € de visita; se ve en la web pero no siempre antes de concertar) | 2026 | Práctica del sector | **Medio** | Si hay coste de visita, se informa **antes de concertarla** (#21 criterio); desplazamiento siempre en el presupuesto (#12) |
| Q6 | **"Todo por teléfono, sin contrato escrito"** | HomeServe (1★: negociado por teléfono, sin contrato; cambios de tarifa sin aviso) | 2026 | Varias | **Alto** | Todo por escrito antes de aceptar: alcance, inclusiones, exclusiones, impuestos, plazo, validez (#4, #12, #21) |
| Q7 | **Renovación automática y cancelación difícil** (modelo suscripción) | HomeServe (1★: "solicitud de cancelación desaparece de mi cuenta"); patrón OCU | 2026 | ~28 % de 1★ HomeServe | **Alto** | Praetoria **no** usa suscripción con permanencia en el MVP; sin pagos recurrentes (EPIC) |
| Q8 | **Profesionales sin verificar / "cualquiera con pagar la cuota accede a tus datos"** | Foros sobre Habitissimo; queja recurrente | 2024–2026 | Varias | **Medio** | Verificación previa a la asignación; no mostrar "verificado" si solo se comprobó teléfono/email (#22) |
| Q9 | **Reseñas poco creíbles / testimonios genéricos** | Sector; contraste Trustpilot 4,7 (cliente) vs 3,5–2,9 (mixto) sugiere sesgo de captación | 2026 | Patrón | **Medio** | Reseñas solo tras trabajo real cerrado, ligadas a solicitud + profesional; medias reproducibles (#26) |
| Q10 | **Fotos / dirección / datos compartidos sin claridad** | Modelo de leads (los datos van a 4 terceros); foros | 2024–2026 | Estructural | **Medio-Alto** | Minimización: fotos y póliza privadas, URLs firmadas y caducables, no se distribuyen más de lo necesario (#6, #14, #17, #21) |
| Q11 | **El seguro deniega la cobertura por "falta de mantenimiento"** (fugas lentas) | OCU (Pelayo daños por agua mar-2026; SegurCaixa Adeslas asistencia ago-2026); fuga-agua.es, peritojudicial.com | 2026 | Patrón sectorial documentado | **Alto** | El análisis de póliza (#15) debe **diferenciar cláusula, norma y valoración**, citar página exacta, y nunca prometer cobertura; explicar el proceso (perito, tercer perito, Defensor del Asegurado, DGSFP) |
| Q12 | **Formularios largos o confusos / hay que saber el gremio** | Marketplaces (eliges categoría primero); apps que "asumen que sabes qué hay que hacer" | 2026 | Estructural | **Medio** | Tres entradas por intención + "no sé qué profesional necesito" + preguntas a medida de la IA, no cuestionario genérico largo (#5 refinamiento) |
| Q13 | **Esperas largas en urgencias pese a "24/7"** | HomeServe (1★: "2+ meses para un calentador urgente, llamadas semanales sin resolución") | 2026 | Varias | **Alto** | No fingir atención urgente 24/7; triaje que da instrucciones seguras y deriva a emergencias cuando toca (#5) |

---

## 7. Oportunidades específicas para Praetoria

| # | Oportunidad | Evidencia que la sustenta | Issues |
|---|---|---|---|
| O1 | **"No vendemos tu solicitud"** como mensaje central y diferencial verificable | Q1, Q2, Q10; modelo declarado de los marketplaces | #4, #21 |
| O2 | **Entrada sin saber el oficio** ("no sé qué profesional necesito" como opción principal) | Q12; Thumbtack/Angi asumen que ya lo sabes | #5 |
| O3 | **Diagnóstico con foto antes de asignar** → menos visitas improductivas | F2, F3; hipótesis de #28 | #6, #7, #8 |
| O4 | **Presupuesto escrito comparable consigo mismo**: alcance, incluido/excluido, desplazamiento, impuestos, plazo, validez, garantía y responsable | Q4, Q5, Q6 | #12, #21 |
| O5 | **Revisión del seguro antes de pagar**, con cláusula y página citadas y borrador revisable | Q11; ningún competidor local lo ofrece | #14, #15 |
| O6 | **Identidad del profesional + alcance real de verificación antes de la visita** | Q3, Q8 | #21, #22 |
| O7 | **Estados claros y un canal de incidencias** (el "después" que los marketplaces no cubren) | Q3, Q7, Q13 | #16, #23 |
| O8 | **Reseñas verificadas ligadas a trabajos reales** y medias reproducibles | Q9 | #26 |
| O9 | **SEO local honesto**: páginas de servicio/problema/municipio con contenido real, sin generación masiva | práctica del sector (páginas programáticas vacías) | #18, #24, #25 |
| O10 | **Accesibilidad y móvil de una mano** como ventaja (los formularios del sector son pobres en esto) | Q12 | #3, #5 |

---

## 8. Propuesta de posicionamiento

> **Praetoria Servicios es el servicio gestionado del hogar para Valencia y su área norte:
> entendemos tu problema con fotos y tus palabras, elegimos nosotros al profesional adecuado,
> te damos un presupuesto claro por escrito y te acompañamos hasta que quede resuelto —
> con tus fotos y tu póliza tratadas con el mínimo de manos posibles.**

- **No somos** un directorio, ni una subasta de leads, ni una suscripción con permanencia.
- **Una sola conversación**, no cuatro llamadas.
- **Antes de aceptar** sabes el alcance, lo excluido, el desplazamiento, los impuestos, el plazo y la
  garantía.
- **Opcional:** te decimos si tu seguro *podría* cubrirlo — nunca "no pagarás".
- Frase corta para la landing (#4): *"No buscamos cuatro profesionales para que te llamen.
  Entendemos el problema, seleccionamos la solución adecuada y te acompañamos hasta que quede
  resuelto."*

---

## 9. Matriz copiar / mejorar / evitar / diferenciar

### Copiar el principio (no el texto ni el diseño)

| Principio | Fuente | Aplicación |
|---|---|---|
| Interpretar el problema con foto + preguntas a medida | Thumbtack, Angi | #5, #7 |
| Clasificar por riesgo de seguridad al inicio | Toolbox Repair | #5 |
| Primera valoración/contacto rápida y visible | Cronoshare | #4, #10 |
| Perfil del profesional con trabajos y verificación | Habitissimo/Zaask | #22 |
| Garantía explícita por escrito | HomeServe | #23 (solo si es sostenible) |

### Mejorar

| Qué | Cómo lo mejora Praetoria |
|---|---|
| Presupuesto | De "cada profesional te manda el suyo" → **un presupuesto gestionado, comparable consigo mismo**, con desplazamiento/extras/impuestos por delante (#12) |
| Diagnóstico | De "match de profesional" → **ficha técnica orientativa** que además clasifica el oficio aunque el cliente no lo sepa (#7) |
| Seguimiento | De "llama al teléfono" → **estados comprensibles + enlace firmado** (#16) |
| Seguro | De "no se toca" → **análisis orientativo con cláusula y página + borrador revisable** (#15) |
| Reseñas | De "opiniones de perfil" → **verificadas y ligadas a trabajo real, medias reproducibles** (#26) |

### Evitar

| Qué evitar | Por qué (evidencia) |
|---|---|
| Vender/distribuir la solicitud a varios profesionales | Q1, Q2, Q10 |
| Suscripción con renovación automática y permanencia en el MVP | Q7 |
| Prometer 24/7 o urgencias que no existen | Q13 |
| "Precio cerrado" con variables sin definir | Q4 |
| Coste de visita comunicado tarde | Q5 |
| Sellos, cifras ("98 % satisfacción", "millones de clientes"), años de experiencia o reseñas sin fuente | Q9; práctica del sector |
| Mostrar "verificado" habiendo comprobado solo teléfono/email | Q8 |
| Páginas locales generadas en masa con el mismo texto | #25; práctica de páginas programáticas |
| Copiar textos, diseño, imágenes o código de competidores | requisito de #28 |

### Diferenciar

| Diferenciador | Sostenible desde el MVP |
|---|---|
| "No vendemos tu solicitud" | ✅ (es una propiedad del proceso) |
| Un único interlocutor | ✅ |
| "No sé qué profesional necesito" como entrada principal | ✅ (#5, #7) |
| Diagnóstico con foto antes de asignar | ✅ (#6, #7) |
| Presupuesto escrito comparable consigo mismo | ✅ (#12) |
| Revisión de seguro antes de pagar | ✅ orientativa (#14, #15) |
| Carta de Confianza con compromisos ligados a funciones reales | ✅ (#21) |

---

## 10. Lista priorizada de decisiones y experimentos

> Impacto: **C**rítico / **A**lto / **M**edio / **B**ajo. "Evidencia vs opinión" separadas.

| # | Decisión concreta | Impacto | Issues | Base |
|---|---|---|---|---|
| **D1** | El asistente **empieza por 3 entradas de intención** (avería/problema · trabajo en casa · comprobar seguro), no por una rejilla de oficios; "No sé qué profesional necesito" siempre visible. | C | #5 | Evidencia (Q12) + comentario del cliente en #5 |
| **D2** | **Triaje de seguridad inmediato** tras la intención (agua descontrolada, gas, humo/chispas, riesgo eléctrico, persona encerrada, riesgo estructural) → instrucciones breves seguras + derivar a emergencias; sin fingir 24/7. | C | #5, #23 | Evidencia (Q13, Toolbox Repair) |
| **D3** | **Nunca se distribuye la solicitud**: un solo interlocutor. Hacerlo explícito en landing y Carta de Confianza como compromiso verificable ("tu solicitud no se vende ni se envía a varios profesionales"). | C | #4, #21 | Evidencia (Q1, Q2, Q10) |
| **D4** | **Plantilla de presupuesto** con campos obligatorios: precio de visita/diagnóstico (y si se descuenta), desplazamiento, mano de obra, materiales incluidos/no incluidos, trabajos preparatorios y retirada/limpieza, impuestos, supuestos que pueden variar el precio, procedimiento de aprobación de extras, profesional asignado + alcance de verificación, fecha/franja + duración estimada, garantía + responsable, y **total máximo** o, si es estimación, etiquetarla como tal. Prohibido "precio cerrado" con variables abiertas. | C | #12, #21 | Evidencia (Q4, Q5, Q6) + comentario del cliente en #12 |
| **D5** | El **análisis de seguro** (#15) diferencia siempre *cláusula de póliza · norma legal · valoración*; toda afirmación contractual lleva **referencia de página**; resultado en 4 estados (cobertura probable / exclusión probable / dudosa / información insuficiente); el borrador se etiqueta "borrador pendiente de revisión" hasta acción expresa del administrador; se explica el proceso real (perito, tercer perito, Defensor del Asegurado, DGSFP) y el patrón de denegación por "falta de mantenimiento". Nunca "no pagarás". | A | #14, #15 | Evidencia (Q11, OCU, peritojudicial) |
| **D6** | **Identidad del profesional + alcance de verificación** se muestran al cliente **antes de la visita**; nunca "verificado" si solo se comprobó teléfono/email; alertas de documentación próxima a caducar. | A | #21, #22 | Evidencia (Q3, Q8) |
| **D7** | **Estados del cliente comprensibles** vía enlace firmado + un botón claro "Tengo un problema con el trabajo"; definir un **SLA interno de primera respuesta** realista (no 24/7) y mostrarlo. | A | #16, #23 | Evidencia (Q3, Q7, Q13) |
| **D8** | **Recorrer y capturar 5 formularios de solicitud en vivo** (Habitissimo, Cronoshare, Zaask, una empresa local, Frontdoor/Thumbtack) **sin enviar datos**, para medir nº de pasos/campos y tiempo hasta iniciar — antes de cerrar el diseño de #5. Guardar capturas en `docs/benchmark-assets/`. | M | #5, #28 | Cierre del criterio parcial de #28 |
| **D9** | **Landing (#4):** bloque de contraste explícito "web local tradicional vs marketplace vs Praetoria"; bloque "Por qué puedes confiar" (enlaza #21); explicación de protección de fotos/dirección/póliza; **ejemplo visual de un presupuesto**; CTA de urgencia diferenciado sin promesa 24/7; copy de seguro "podría estar cubierto". **Cero** cifras/reseñas/años/garantías inventadas. | A | #4, #21 | Evidencia (Q6, Q9) + comentario del cliente en #4 |
| **D10** | **SEO local honesto (#25):** una página de municipio solo se indexa si aporta contenido específico real (cobertura, tiempos verificables, trabajos hechos, preguntas locales); nada de "fontanero + cada municipio" con el mismo texto. Reseñas verificadas y casos anonimizados como fuente de contenido (#24, #26), nunca generación masiva sin evidencia propia. | M | #18, #24, #25, #26 | Práctica del sector (páginas programáticas) |
| **D11** *(experimento)* | Medir en el MVP la **hipótesis F1**: ¿un único interlocutor genera más finalización del recorrido que la expectativa de "varios presupuestos"? Evento de analítica sin PII: intención → análisis → solicitud enviada, segmentado por si el usuario eligió "no sé". | B | #18 | Hipótesis de #28 |
| **D12** *(experimento)* | Medir si **mostrar el ejemplo de presupuesto en landing** mejora la conversión a "iniciar solicitud" (A/B cuando haya volumen). | B | #4, #18 | Hipótesis de #28 |

---

## 11. Riesgos de hacer promesas que todavía no se pueden sostener

| Riesgo | Mitigación |
|---|---|
| Prometer **"respuesta en 24 h"** sin capacidad operativa para cumplirlo siempre | Formularlo como objetivo configurable ("menos de 24 h laborables") y medir el cumplimiento real antes de destacarlo como cifra |
| Prometer **garantía de 1 año** al estilo HomeServe sin base contractual | #23: diferenciar garantía legal / comercial / cortesía; no fijar un plazo uniforme sin validación jurídica |
| Sugerir **cobertura del seguro** que luego se deniega | #15: lenguaje de probabilidad, referencias de página, "borrador pendiente de revisión", explicar el proceso de reclamación |
| Mostrar **"profesionales verificados"** sin verificación real de habilitación | #22: estados de verificación explícitos; no usar el sello si solo se comprobó contacto |
| Publicar **reseñas o medias** antes de tener trabajos reales cerrados | #26: cero reseñas ficticias; medias solo con datos reales; en producción, ninguna reseña de demostración |
| Afirmar **cobertura geográfica** que no se atiende | #18/#25: cobertura por municipio/CP configurable en `src/config/coverage.ts`; página de cobertura solo con municipios realmente atendidos |
| Presentar el **diagnóstico de IA** como definitivo | #7/#8: siempre "orientativo"; requiere inspección presencial cuando corresponda |

---

## Conversión en producto (seguimiento en los issues)

Al publicar este documento se comenta en cada issue afectado el hallazgo y la decisión, con nivel de
impacto, separando evidencia de opinión, **sin crear issues duplicados**:

- **#3** (identidad/diseño) — D1, D2, D10; accesibilidad y "una mano" como diferencial (O10).
- **#4** (landing) — D3, D9, D11, D12; frase de posicionamiento (§8); ejemplo visual de presupuesto.
- **#5** (asistente) — D1, D2, D8; preguntas a medida en vez de cuestionario largo.
- **#12** (presupuestos) — D4 (lista de campos obligatoria).
- **#15** (análisis de seguro) — D5.
- **#21** (Carta de Confianza) — D3, D6, D9; cada compromiso ligado a una función real.
- **#22** (red de profesionales) — D6; estados de verificación, no "verificado" por teléfono/email.
- **#23** (cierre/garantía/incidencias) — D2, D7; SLA realista, botón "tengo un problema".
- **#25** (arquitectura SEO) — D10.
- **#26** (reseñas) — D10; verificadas, medias reproducibles.

**No se han creado issues nuevos:** todo el trabajo detectado encaja en issues existentes (#1–#27).

---

## Anexo — Enlaces fechados (bibliografía)

Todos consultados el 29 de agosto de 2026.

1. Habitissimo — Centro de Ayuda "¿Cómo funciona?": https://soporte.habitissimo.com/hc/es/articles/204309623
2. Habitissimo — Trustpilot ES (3,5/5; 4.728 reseñas): https://es.trustpilot.com/review/habitissimo.es
3. Cronoshare — "¿Es un timo o estafa?": https://www.cronoshare.com/atencion-cliente/es-un-timo-estafa-cronoshare
4. Cronoshare — Trustpilot ES (4,7/5; 4.420 reseñas): https://es.trustpilot.com/review/cronoshare.com
5. Zaask — "¿Cómo funciona?": https://www.zaask.es/como-funciona
6. Wolly — comparativa de plataformas: https://www.wollyhome.com/blog/comparativa-definitiva-entre-plataformas-para-profesionales-habitissimo-webel-cronoshare-y-wolly
7. HomeServe — FAQs: https://www.homeserve.es/faqs
8. HomeServe — Trustpilot ES (2,9/5; 4.111 reseñas): https://es.trustpilot.com/review/homeserve.es
9. Reparalia — Trustpilot ES: https://es.trustpilot.com/review/reparalia.es
10. Manitas en Valencia: https://manitasenvalencia.com/
11. El Manitas Ideal (Valencia): https://elmanitasideal.es/
12. OCU — reclamación SegurCaixa Adeslas (asistencia hogar, 16-ago-2026): https://www.ocu.org/reclamar/lista-reclamaciones-publicas/incumplimiento-del-servicio-de/7d7769c432cf657771
13. OCU — reclamación Pelayo (daños por agua, 17-mar-2026): https://www.ocu.org/reclamar/lista-reclamaciones-publicas/ayuda-por-da-C3-B1os-de-agua/64829a5583fb86d004
14. Perito Judicial — reclamar daños por agua: https://peritojudicial.com/reclamar-danos-agua-indemnizacion/
15. Fuga-Agua — seguro de hogar y fugas: https://www.fuga-agua.es/blog/seguro-hogar-fugas
16. Angi — AI Helper (nota de prensa): https://www.angi.com/press/angi-ai-helper
17. Frontdoor — home: https://www.frontdoor.com/
18. Toolbox — mejores apps de reparación 2026: https://toolbox.repair/best-home-repair-apps
19. HomeMD.ai — comparativa de herramientas de IA para reparación del hogar 2026: https://homemd.ai/guides/best-ai-home-repair-tools-2026-comparison
