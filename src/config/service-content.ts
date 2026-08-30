import { TRADES } from "./trades";

/**
 * Per-trade editorial content for the `/servicios/[slug]` pages (issue #18, D10).
 *
 * D10 forbids "trade + every municipality" duplication and thin templated pages.
 * Each entry below is written for that specific trade: the jobs it covers, the
 * problems people actually describe, what the quote contains and how the process
 * runs. If a trade has no real, specific content it does not get a page.
 *
 * Editable configuration — an operator can rewrite any of this without touching
 * components.
 */

export interface ServiceContent {
  /** short, trade-specific introduction (also used as the Service JSON-LD description) */
  intro: string;
  /** concrete jobs this service covers */
  covers: string[];
  /** problems clients typically describe in their own words */
  typicalProblems: string[];
  /** what a Praetoria quote for this trade itemises */
  quoteIncludes: string[];
  /** how the process runs for this kind of work */
  howItWorks: string[];
  /** the home-insurance angle — only where it is genuinely relevant */
  insuranceAngle?: string;
}

const CONTENT: Record<string, ServiceContent> = {
  fontaneria: {
    intro:
      "Fugas, grifería, desagües y calentadores en viviendas de Valencia y el área metropolitana " +
      "norte. Con tus fotos identificamos si es una reparación puntual o una intervención mayor " +
      "antes de que nadie se desplace.",
    covers: [
      "Sustitución de grifos, flexos, llaves de paso y mecanismos de cisterna",
      "Reparación de fugas en sifones, desagües y juntas bajo fregadero o lavabo",
      "Desatascos de fregadero, lavabo, ducha e inodoro",
      "Sustitución o reparación de calentadores y termos eléctricos",
      "Detección de fugas de agua en paredes y suelos y localización del punto",
      "Cambio de latiguillos, válvulas y grupos de seguridad",
    ],
    typicalProblems: [
      "«Gotea por debajo del fregadero y he tenido que poner un cubo»",
      "«El inodoro no para de correr agua después de tirar de la cadena»",
      "«Sale muy poca presión de agua caliente en la ducha»",
      "«Tengo una mancha de humedad en el techo del vecino de abajo»",
    ],
    quoteIncludes: [
      "Diagnóstico del origen de la fuga o avería, no solo del síntoma",
      "Mano de obra y desplazamiento",
      "Materiales concretos (marca y modelo de grifo, mecanismo o calentador)",
      "Si hace falta abrir cata en pared o suelo, se indica y se presupuesta aparte",
      "Plazo y garantía de la reparación",
    ],
    howItWorks: [
      "Nos envías fotos del punto que gotea y, si puedes, de la llave de paso general",
      "Hacemos una lectura orientativa: reparación sencilla, sustitución o localización de fuga",
      "Recibes un presupuesto con el alcance cerrado y, si procede, una visita de diagnóstico",
      "Un fontanero identificado ejecuta el trabajo y lo dejamos documentado",
    ],
    insuranceAngle:
      "Los daños por agua son la causa más frecuente de parte en el seguro de hogar. Si la fuga ha " +
      "dañado suelo, pintura o el piso de un vecino, podemos hacer una lectura orientativa de tu " +
      "póliza y prepararte un borrador de comunicación a la aseguradora.",
  },
  electricidad: {
    intro:
      "Instalaciones eléctricas domésticas: cuadro, circuitos, enchufes, puntos de luz y pequeñas " +
      "ampliaciones. Priorizamos las incidencias con riesgo y te damos indicaciones de seguridad " +
      "antes de la visita.",
    covers: [
      "Cuadro eléctrico: diferenciales que saltan, magnetotérmicos, reetiquetado de circuitos",
      "Sustitución de enchufes, interruptores y bases que calientan o chispean",
      "Puntos de luz nuevos, sustitución de plafones y aplicaciones de LED",
      "Circuitos que no dan tensión o que se disparan al conectar un electrodoméstico",
      "Revisión tras humedad o pequeño cortocircuito",
      "Pequeñas ampliaciones y tomas para electrodomésticos concretos",
    ],
    typicalProblems: [
      "«Salta el automático cada vez que enchufo la lavadora y el microondas a la vez»",
      "«Un enchufe de la cocina ha dejado de funcionar y huele un poco a quemado»",
      "«Se van las luces de media casa pero los enchufes siguen»",
      "«Quiero un punto de luz nuevo en el pasillo»",
    ],
    quoteIncludes: [
      "Comprobación del cuadro y del circuito afectado antes de tocar nada",
      "Mano de obra y material eléctrico homologado",
      "Diagnóstico de si es un punto concreto o un problema del circuito",
      "Recomendación, sin obligación, si la instalación está al límite de capacidad",
      "Plazo, garantía y, si aplica, boletín",
    ],
    howItWorks: [
      "Nos describes qué falla y qué has conectado cuando ocurre; foto del cuadro abierto si es seguro",
      "Valoramos si hay riesgo y te damos pasos de seguridad inmediatos",
      "Presupuesto con el circuito o elemento a intervenir claramente acotado",
      "Un electricista identificado realiza la intervención y prueba el circuito contigo",
    ],
    insuranceAngle:
      "Si ha habido un daño eléctrico (una sobretensión que ha estropeado aparatos, por ejemplo) " +
      "puede entrar en la cobertura de daños eléctricos de tu póliza. Podemos orientarte sobre qué " +
      "cláusula podría aplicar y qué debes acreditar.",
  },
  electrodomesticos: {
    intro:
      "Reparación de electrodomésticos de línea blanca: lavadora, lavavajillas, frigorífico, horno, " +
      "secadora y placa. Con la marca, el modelo y una descripción del fallo valoramos si compensa " +
      "reparar antes de mover el aparato.",
    covers: [
      "Lavadoras: no centrifuga, no carga agua, pierde agua, hace ruido o no gira el tambor",
      "Lavavajillas: no seca, deja restos, no desagua o marca error de entrada de agua",
      "Frigoríficos: no enfría, escarcha en exceso, gotea agua dentro o hace ruido el compresor",
      "Hornos y placas: no calientan, fallo de resistencia, chispas en la placa de inducción",
      "Secadoras: no seca, tarda mucho o marca depósito lleno sin estarlo",
      "Sustitución de gomas, bombas, resistencias, termostatos y electrónica",
    ],
    typicalProblems: [
      "«La lavadora se queda con agua y ropa dentro y marca un error»",
      "«El frigorífico congela la comida en la balda de arriba»",
      "«El lavavajillas deja los vasos con un poso blanco»",
      "«El horno se enciende pero no coge temperatura»",
    ],
    quoteIncludes: [
      "Valoración de reparabilidad: coste estimado de la reparación frente al de reponer el aparato",
      "Mano de obra y desplazamiento",
      "Recambio concreto identificado por marca y modelo, con su disponibilidad",
      "Si el diagnóstico exige abrir el aparato, se indica como visita y se descuenta si aceptas",
      "Garantía sobre la pieza y la reparación",
    ],
    howItWorks: [
      "Nos pasas marca, modelo (etiqueta del aparato) y qué hace exactamente cuando falla",
      "Hacemos una lectura previa de la avería probable y de si merece la pena repararlo",
      "Presupuesto con el recambio identificado y el plazo de suministro",
      "Un técnico identificado repara y prueba el programa completo contigo",
    ],
  },
  montaje: {
    intro:
      "Montaje de muebles, estanterías, cortinas, soportes de televisión y pequeño mobiliario. " +
      "Ideal cuando tienes el producto pero no las herramientas, el tiempo o la seguridad de " +
      "fijarlo bien a la pared.",
    covers: [
      "Armarios, cómodas, estanterías y muebles de cocina en kit",
      "Soportes de televisión fijos y articulados, con paso de cables",
      "Barras de cortina, estores y rieles, incluida la medición",
      "Baldas, repisas y colgadores con la fijación adecuada a cada tipo de pared",
      "Cabeceros, canapés y somieres",
      "Revisión y aprieto de muebles ya montados que se han quedado inestables",
    ],
    typicalProblems: [
      "«Tengo el armario de tres cuerpos en las cajas y no me atrevo a montarlo»",
      "«Quiero la tele en la pared pero no sé si el tabique aguanta»",
      "«Las baldas que puse se están descolgando»",
      "«Necesito montar la habitación del bebé antes de una fecha»",
    ],
    quoteIncludes: [
      "Tiempo de montaje estimado según el mueble y el número de módulos",
      "Mano de obra y tornillería o tacos especiales si la pared lo requiere",
      "Fijación a pared segura (tipo de anclaje según sea ladrillo, pladur o hormigón)",
      "Retirada de embalajes si lo pides",
      "Plazo y garantía sobre el montaje",
    ],
    howItWorks: [
      "Nos dices qué mueble es (enlace o foto de la caja) y dónde va",
      "Confirmamos el tiempo y si hace falta anclaje especial por el tipo de pared",
      "Presupuesto cerrado por el montaje concreto",
      "Un montador identificado lo deja montado, nivelado y fijado",
    ],
  },
  carpinteria: {
    intro:
      "Carpintería de madera y de interior: puertas de paso, armarios, cajones, tapajuntas y " +
      "cerraduras de mueble. Ajustes y reparaciones que devuelven el uso sin cambiar la pieza " +
      "entera cuando no hace falta.",
    covers: [
      "Puertas que rozan, no cierran o tienen holgura en bisagras",
      "Ajuste y sustitución de cerraduras y manetas de puertas de paso",
      "Cajones descarrilados, guías rotas y frentes despegados",
      "Armarios empotrados: baldas, barras, puertas descolgadas y correderas",
      "Rodapiés, tapajuntas, molduras y remates de madera",
      "Pequeñas reparaciones de tarima y parquet flotante (piezas sueltas o levantadas)",
    ],
    typicalProblems: [
      "«La puerta del baño se ha hinchado y hay que empujar fuerte para cerrarla»",
      "«Una puerta corredera del armario se ha salido del carril»",
      "«Los cajones de la cocina se caen al abrirlos del todo»",
      "«Se ha levantado una lama del parquet en el salón»",
    ],
    quoteIncludes: [
      "Diagnóstico de si es ajuste, sustitución de herraje o cambio de pieza",
      "Mano de obra y herrajes concretos (bisagras, guías, cerraduras)",
      "Si hay que lijar, sellar o pintar la zona intervenida, se indica",
      "Plazo y garantía",
    ],
    howItWorks: [
      "Nos envías fotos de la puerta, el cajón o el armario y de cómo encaja mal",
      "Valoramos si se resuelve con ajuste o requiere recambio",
      "Presupuesto con el alcance y los herrajes detallados",
      "Un carpintero identificado ajusta la pieza y comprueba el cierre contigo",
    ],
  },
  pintura: {
    intro:
      "Pintura de interior en vivienda habitada: habitaciones, pasillos, techos y tratamiento de " +
      "humedades y desconchones. Presupuesto por metros y por trabajo, no «a ojo».",
    covers: [
      "Pintado de habitaciones y zonas comunes con protección de suelo y mobiliario",
      "Techos, incluido el sellado de grietas de asentamiento",
      "Tratamiento de humedades y moho: causa, saneado, imprimación anti-humedad y acabado",
      "Reparación de desconchones, agujeros de tacos y fisuras antes de pintar",
      "Esmaltado de puertas, marcos y radiadores",
      "Pequeños gotelé y alisado de paredes",
    ],
    typicalProblems: [
      "«Ha salido moho negro en la esquina del dormitorio que da a la fachada»",
      "«Quiero pintar el piso antes de entrar a vivir»",
      "«La pared del baño está llena de burbujas y se descascarilla»",
      "«Tengo marcas por todas partes de cuadros y muebles antiguos»",
    ],
    quoteIncludes: [
      "Metros cuadrados reales de pared y techo, y número de manos",
      "Preparación: emplastecido, lijado, imprimación y protección de la vivienda",
      "Marca y tipo de pintura (lavable, antihumedad, plástica mate)",
      "Tratamiento de la causa cuando hay humedad, no solo tapar la mancha",
      "Plazo, número de jornadas y garantía",
    ],
    howItWorks: [
      "Nos pasas fotos de cada estancia y de las zonas dañadas, con medidas aproximadas si puedes",
      "Distinguimos lo que es pintar de lo que es reparar antes de pintar",
      "Presupuesto desglosado por estancia y por preparación",
      "Un pintor identificado ejecuta el trabajo protegiendo la casa y recogiendo cada jornada",
    ],
    insuranceAngle:
      "Cuando el deterioro de la pintura viene de un daño por agua cubierto (una fuga, una " +
      "filtración del vecino), la reparación del acabado suele ir asociada al parte. Podemos " +
      "orientarte sobre cómo encajarlo en la comunicación a la aseguradora.",
  },
  jardineria: {
    intro:
      "Mantenimiento de jardines particulares, terrazas y patios en el área de Valencia: poda, " +
      "desbroce, riego y puesta a punto de temporada. Para propiedades pequeñas y medianas, no " +
      "obra de paisajismo.",
    covers: [
      "Poda de setos, arbustos y árboles pequeños, con retirada de restos",
      "Desbroce y limpieza de parcelas y zonas ajardinadas descuidadas",
      "Revisión y reparación de riego por goteo y programadores",
      "Mantenimiento de césped: siega, escarificado y resiembra",
      "Plantación de temporada y sustitución de ejemplares secos",
      "Puesta a punto de terrazas y jardineras",
    ],
    typicalProblems: [
      "«El seto de la entrada se ha desmadrado y tapa media ventana»",
      "«El programador de riego no arranca y se me secan las macetas»",
      "«Tengo la parcela con hierba hasta la rodilla»",
      "«Quiero dejar la terraza lista para el verano»",
    ],
    quoteIncludes: [
      "Alcance del trabajo (superficie, número de plantas o metros de seto)",
      "Mano de obra y maquinaria",
      "Retirada y gestión de restos vegetales",
      "Material vegetal o piezas de riego, cuando corresponda",
      "Si interesa, propuesta de mantenimiento periódico con su precio",
    ],
    howItWorks: [
      "Nos envías fotos del jardín o la terraza y nos dices qué te gustaría conseguir",
      "Definimos si es una actuación puntual o un mantenimiento recurrente",
      "Presupuesto con el alcance y la retirada de restos incluida o aparte",
      "Un profesional identificado realiza el trabajo y deja la zona recogida",
    ],
  },
  limpieza: {
    intro:
      "Limpiezas puntuales y a fondo: fin de obra, cambio de inquilino, casa cerrada mucho tiempo " +
      "o un empujón antes de un evento. No es un servicio de limpieza recurrente por horas.",
    covers: [
      "Limpieza fin de obra: retirada de polvo de yeso, restos de pintura y adhesivos",
      "Limpieza a fondo de cocina y baños: cal, grasa incrustada y juntas",
      "Cristales, marcos y persianas por dentro y por fuera (planta baja o con acceso seguro)",
      "Viviendas que llevan meses cerradas: polvo, humedad superficial y olores",
      "Preparación de un piso para entrega de llaves o para una visita",
      "Limpieza de electrodomésticos por dentro (horno, frigorífico, campana)",
    ],
    typicalProblems: [
      "«Acaban de terminar la reforma y hay polvo blanco en absolutamente todo»",
      "«Se van los inquilinos y hay que dejarlo listo para enseñarlo»",
      "«La casa del pueblo lleva cerrada todo el invierno»",
      "«Necesito la cocina impecable para la semana que viene»",
    ],
    quoteIncludes: [
      "Metros y estado real de partida (obra, abandono, mantenimiento)",
      "Número de operarios y horas estimadas",
      "Productos y material incluidos",
      "Qué queda dentro del alcance y qué no (por ejemplo, vaciar enseres)",
      "Fecha y franja de ejecución",
    ],
    howItWorks: [
      "Nos pasas fotos de cada estancia y nos dices para qué fecha lo necesitas",
      "Ajustamos el equipo y las horas al estado real, no a una tarifa plana",
      "Presupuesto cerrado por el trabajo, no por hora abierta",
      "Un equipo identificado realiza la limpieza y la repasas con ellos al terminar",
    ],
  },
  mudanzas: {
    intro:
      "Mudanzas y traslados dentro de Valencia y su área: piso a piso, vaciado, guardamuebles o " +
      "traslado de muebles concretos. Con el inventario y las dos direcciones cerramos un precio " +
      "sin sorpresas.",
    covers: [
      "Mudanza completa de vivienda con embalaje, carga, transporte y descarga",
      "Traslado de piezas concretas (sofá, electrodomésticos, piano vertical)",
      "Vaciado de pisos y gestión de enseres al punto limpio",
      "Embalaje profesional de cocina, libros y objetos frágiles",
      "Montaje y desmontaje de muebles asociados a la mudanza",
      "Portes puntuales de recogida en tienda o segunda mano",
    ],
    typicalProblems: [
      "«Me mudo a tres calles pero tengo un salón entero y no tengo coche»",
      "«Hay que vaciar el piso de un familiar y no sé por dónde empezar»",
      "«Necesito subir un sofá a un cuarto sin ascensor»",
      "«Compré un armario de segunda mano y no puedo transportarlo»",
    ],
    quoteIncludes: [
      "Inventario aproximado y volumen estimado",
      "Direcciones, plantas, ascensor y distancia de porte en cada extremo",
      "Personal, vehículo y material de embalaje",
      "Necesidad de reserva de aparcamiento o de plataforma elevadora",
      "Fecha, franja horaria y seguro del transporte",
    ],
    howItWorks: [
      "Nos das el listado de lo que se mueve y las dos direcciones con su planta y ascensor",
      "Calculamos volumen, personal y vehículo, y si hace falta permiso de ocupación de vía",
      "Presupuesto cerrado con la fecha reservada",
      "Un equipo identificado embala, traslada y coloca donde indiques",
    ],
  },
  climatizacion: {
    intro:
      "Aire acondicionado, bombas de calor y calefacción doméstica: instalación de equipos de " +
      "pared, mantenimiento, recarga de gas y averías. Con el modelo y el síntoma valoramos si es " +
      "mantenimiento o reparación.",
    covers: [
      "Instalación de splits de pared 1x1 y multisplit en vivienda",
      "Mantenimiento y limpieza de unidades interiores y exteriores",
      "Equipos que no enfrían o no calientan, pierden agua o hacen ruido",
      "Recarga de gas refrigerante y detección de fugas del circuito",
      "Termostatos, programadores y radiadores que no calientan de forma uniforme",
      "Revisión antes de temporada (verano o invierno)",
    ],
    typicalProblems: [
      "«El aire echa aire pero no enfría como antes y gotea por dentro»",
      "«Quiero poner aire en dos habitaciones y no sé si con un multisplit»",
      "«La unidad de fuera hace un ruido raro al arrancar»",
      "«Un radiador se queda frío mientras los demás calientan»",
    ],
    quoteIncludes: [
      "Diagnóstico: mantenimiento, recarga, avería de componente o final de vida del equipo",
      "Mano de obra, desplazamiento y, en instalación, metros de línea frigorífica y soportes",
      "Equipo concreto propuesto con su potencia (frigorías) adecuada a la estancia",
      "Gestión del gas refrigerante conforme a normativa",
      "Plazo, garantía y recomendación de mantenimiento",
    ],
    howItWorks: [
      "Nos pasas marca y modelo del equipo (o los metros de la estancia si es instalación nueva)",
      "Valoramos si es mantenimiento, reparación o sustitución",
      "Presupuesto con el equipo o la intervención detallada",
      "Un instalador identificado ejecuta el trabajo y prueba frío y calor contigo",
    ],
    insuranceAngle:
      "Si la unidad ha provocado un daño por agua (una bandeja de condensados desbordada que ha " +
      "manchado el techo, por ejemplo), el daño derivado puede entrar en la póliza aunque el " +
      "aparato no. Podemos orientarte sobre esa distinción.",
  },
  cerrajeria: {
    intro:
      "Cerraduras, llaves y puertas de vivienda: aperturas sin daño cuando es posible, cambio de " +
      "bombín, refuerzos y puertas que han dejado de cerrar bien. Las urgencias con puerta " +
      "bloqueada se priorizan.",
    covers: [
      "Apertura de puerta bloqueada o con llave rota dentro del bombín",
      "Cambio de bombín por pérdida de llaves o por seguridad tras una mudanza",
      "Bombines de alta seguridad y sistemas antibumping y antitaladro",
      "Puertas que no cierran: ajuste de cerradura, cerradero y bisagras",
      "Reparación y sustitución de cerraduras de puertas de garaje y trastero",
      "Refuerzos, escudos protectores y cerrojos adicionales",
    ],
    typicalProblems: [
      "«Se ha partido la llave dentro de la cerradura y no puedo entrar»",
      "«He perdido el juego de llaves y quiero cambiar el bombín hoy»",
      "«La puerta hay que levantarla para que entre el pestillo»",
      "«Acabo de comprar el piso y no sé cuántas copias de llave circulan»",
    ],
    quoteIncludes: [
      "Si es apertura: intento de apertura sin daño antes de cualquier sustitución",
      "Mano de obra y desplazamiento, con recargo claro si es fuera de horario",
      "Bombín o cerradura concretos, con su nivel de seguridad y número de llaves",
      "Diagnóstico de si el problema es la cerradura o el ajuste de la puerta",
      "Garantía sobre el material y la instalación",
    ],
    howItWorks: [
      "Nos dices qué ha pasado y envías una foto de la cerradura y del canto de la puerta",
      "Si es urgencia con puerta bloqueada, se prioriza y se confirma el coste antes de ir",
      "Presupuesto con la apertura y, si procede, el bombín de sustitución",
      "Un cerrajero identificado abre o sustituye y comprueba el cierre contigo",
    ],
  },
};

export function serviceContentFor(tradeKey: string): ServiceContent {
  const content = CONTENT[tradeKey];
  if (!content) {
    throw new Error(`No service content for trade "${tradeKey}"`);
  }
  return content;
}

/** Trades that have real content and therefore get an indexable service page (D10). */
export const SERVICE_TRADES = TRADES.filter((t) => t.key in CONTENT);
