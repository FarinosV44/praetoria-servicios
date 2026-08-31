/**
 * Curated common home problems for `/problemas/[slug]` (issue #25).
 *
 * D10: these are hand-written, each specific to that problem — symptoms, likely
 * causes, urgency, safety steps, the trade needed. Not auto-generated, not
 * "problem × municipality" duplication. A problem only gets a page if it has
 * real content here.
 *
 * Editable configuration — an operator can rewrite any of this without touching code.
 */

export type ProblemUrgency = "BAJA" | "MEDIA" | "ALTA";

export interface Problem {
  slug: string;
  title: string;
  /** the trade that resolves it (key from src/config/trades.ts) */
  trade: string;
  intro: string;
  symptoms: string[];
  causes: string[];
  urgency: ProblemUrgency;
  /** what to do safely before help arrives */
  safetySteps: string[];
  professionalNeeded: string;
  /** the home-insurance angle, only where genuinely relevant */
  insuranceAngle?: string;
  relatedProblems?: string[];
}

const PROBLEMS: Problem[] = [
  {
    slug: "fuga-de-agua",
    title: "Fuga de agua en casa",
    trade: "fontaneria",
    intro:
      "Una fuga de agua puede ir desde un goteo bajo el fregadero hasta una tubería rota dentro de " +
      "la pared. Cuanto antes se localiza el origen, menor es el daño en suelo, pintura y en el piso de abajo.",
    symptoms: [
      "Goteo continuo o charco bajo el fregadero, el lavabo o el inodoro",
      "Mancha de humedad que crece en pared o techo",
      "El contador de agua sigue girando con todos los grifos cerrados",
      "Presión de agua más baja de lo normal",
    ],
    causes: [
      "Junta o latiguillo envejecido bajo un sanitario",
      "Sifón mal apretado o agrietado",
      "Tubería corroída o mal soldada dentro de la pared o el suelo",
      "Válvula o llave de paso que no cierra del todo",
    ],
    urgency: "MEDIA",
    safetySteps: [
      "Cierra la llave de paso general si el agua no se controla",
      "Retira lo que pueda dañarse y recoge el agua acumulada",
      "Haz fotos del punto que gotea y de la zona afectada antes de secar",
    ],
    professionalNeeded:
      "Un fontanero. Si hay que abrir cata en pared o suelo para localizar la fuga, se indica y se presupuesta aparte.",
    insuranceAngle:
      "Los daños por agua son la causa más común de parte en el seguro de hogar. Si la fuga ha dañado " +
      "acabados o el piso de un vecino, podemos orientarte sobre la posible cobertura y prepararte un borrador para la aseguradora.",
    relatedProblems: ["grifo-que-gotea", "humedad-en-pared", "inodoro-que-corre"],
  },
  {
    slug: "grifo-que-gotea",
    title: "Grifo que gotea",
    trade: "fontaneria",
    intro:
      "Un grifo que gotea desperdicia agua y suele empeorar. La reparación casi siempre es rápida " +
      "y barata si se atiende antes de que el mecanismo se dañe del todo.",
    symptoms: [
      "Goteo constante por la boca del grifo aunque esté cerrado",
      "Agua que sale por la base o por la maneta",
      "El grifo hace ruido o cuesta girarlo",
    ],
    causes: [
      "Cartucho o pastillas cerámicas desgastadas",
      "Junta tórica o retén envejecido",
      "Cal acumulada en el aireador o en el mecanismo",
    ],
    urgency: "BAJA",
    safetySteps: [
      "Cierra la llave de paso del propio grifo (bajo el mueble) si el goteo es fuerte",
      "Anota la marca y el modelo del grifo si puedes verlo",
    ],
    professionalNeeded: "Un fontanero. Suele resolverse cambiando el cartucho o las juntas en la misma visita.",
    relatedProblems: ["fuga-de-agua", "poca-presion-de-agua"],
  },
  {
    slug: "inodoro-que-corre",
    title: "El inodoro no para de correr agua",
    trade: "fontaneria",
    intro:
      "Cuando la cisterna sigue llenándose después de tirar de la cadena, el mecanismo de descarga " +
      "o el de llenado no cierra bien. Es un consumo de agua continuo y silencioso.",
    symptoms: [
      "Ruido de agua constante en la cisterna",
      "Hay que mover la maneta para que pare",
      "El nivel de la cisterna se ve siempre por encima del rebosadero",
    ],
    causes: [
      "Junta de la campana o del clapet desgastada",
      "Flotador mal ajustado o roto",
      "Cal en el mecanismo de llenado",
    ],
    urgency: "BAJA",
    safetySteps: ["Cierra la llave de escuadra de la cisterna para cortar el consumo mientras tanto"],
    professionalNeeded: "Un fontanero. Normalmente se cambia el mecanismo interior completo.",
    relatedProblems: ["fuga-de-agua"],
  },
  {
    slug: "poca-presion-de-agua",
    title: "Sale poca presión de agua",
    trade: "fontaneria",
    intro:
      "La presión baja puede afectar a un solo grifo o a toda la vivienda, y a veces solo al agua " +
      "caliente. El origen cambia mucho según ese detalle.",
    symptoms: [
      "Un grifo da menos caudal que el resto",
      "Baja presión en toda la casa",
      "Solo baja la presión del agua caliente",
    ],
    causes: [
      "Aireador o ducha obstruidos por cal",
      "Llave de paso parcialmente cerrada",
      "Calentador o termo con acumulación de cal (si es solo el agua caliente)",
      "Avería en la acometida o en el grupo de presión del edificio",
    ],
    urgency: "BAJA",
    safetySteps: ["Comprueba que las llaves de paso están totalmente abiertas"],
    professionalNeeded: "Un fontanero, que primero descarta lo sencillo (aireadores, llaves) antes de mirar la instalación.",
    relatedProblems: ["grifo-que-gotea", "calentador-no-da-agua-caliente"],
  },
  {
    slug: "calentador-no-da-agua-caliente",
    title: "El calentador no da agua caliente",
    trade: "fontaneria",
    intro:
      "Quedarse sin agua caliente suele deberse al calentador o al termo. Con la marca, el modelo y " +
      "el tipo de aparato (gas o eléctrico) se puede orientar la avería antes de la visita.",
    symptoms: [
      "El agua sale fría o templada aunque el aparato esté encendido",
      "El calentador se enciende y se apaga solo",
      "Marca un código de error",
    ],
    causes: [
      "Piloto o encendido que falla (calentadores de gas)",
      "Resistencia o termostato averiados (termos eléctricos)",
      "Cal acumulada que reduce el rendimiento",
      "Falta de suministro de gas o de tensión",
    ],
    urgency: "MEDIA",
    safetySteps: [
      "Si hueles a gas, no enciendas nada, ventila, cierra la llave del gas y sal de casa antes de llamar",
      "Comprueba que hay suministro de gas y de electricidad",
    ],
    professionalNeeded:
      "Un profesional de fontanería o climatización según el aparato. Los trabajos de gas requieren una persona habilitada.",
    relatedProblems: ["poca-presion-de-agua"],
  },
  {
    slug: "enchufe-que-chispea",
    title: "Un enchufe chispea o huele a quemado",
    trade: "electricidad",
    intro:
      "Un enchufe que chispea, calienta o huele a quemado es un riesgo real de incendio. No conviene " +
      "seguir usándolo hasta que lo revise un electricista.",
    symptoms: [
      "Chispa al enchufar o desenchufar un aparato",
      "El enchufe o la clavija están calientes o descoloridos",
      "Olor a plástico quemado cerca de la toma",
    ],
    causes: [
      "Conexiones flojas dentro de la caja del enchufe",
      "Toma antigua o de baja calidad que no aguanta la carga",
      "Circuito sobrecargado por conectar varios aparatos de mucha potencia",
    ],
    urgency: "ALTA",
    safetySteps: [
      "Deja de usar ese enchufe y desconecta lo que tenga conectado",
      "Si hay olor fuerte o humo, baja el automático de ese circuito en el cuadro",
    ],
    professionalNeeded:
      "Un electricista. Este oficio está regulado: pide una empresa o un instalador habilitado.",
    insuranceAngle:
      "Si una sobretensión o un fallo eléctrico ha dañado electrodomésticos, puede entrar en la " +
      "cobertura de daños eléctricos de tu póliza. Podemos orientarte sobre qué acreditar.",
    relatedProblems: ["salta-el-diferencial", "media-casa-sin-luz"],
  },
  {
    slug: "salta-el-diferencial",
    title: "Salta el diferencial del cuadro",
    trade: "electricidad",
    intro:
      "El diferencial protege contra fugas de corriente. Que salte de vez en cuando puede ser normal; " +
      "que salte repetidamente indica una fuga a tierra que hay que localizar.",
    symptoms: [
      "El diferencial salta al conectar un electrodoméstico concreto",
      "Salta sin que hagas nada, a cualquier hora",
      "No vuelve a subir o salta de inmediato al subirlo",
    ],
    causes: [
      "Un electrodoméstico con derivación (lavadora, termo, horno)",
      "Humedad en una caja de conexiones o en un punto de luz exterior",
      "Cable dañado en la instalación",
      "Diferencial envejecido y demasiado sensible",
    ],
    urgency: "MEDIA",
    safetySteps: [
      "Desconecta todos los aparatos, sube el diferencial y ve conectando uno a uno para identificar cuál lo hace saltar",
      "Si no sube de ninguna manera, no fuerces la palanca",
    ],
    professionalNeeded: "Un electricista habilitado, que mide el aislamiento de cada circuito para localizar la fuga.",
    relatedProblems: ["enchufe-que-chispea", "media-casa-sin-luz"],
  },
  {
    slug: "media-casa-sin-luz",
    title: "Se ha quedado media casa sin luz",
    trade: "electricidad",
    intro:
      "Cuando una parte de la vivienda se queda sin luz pero el resto funciona, casi siempre ha " +
      "saltado el magnetotérmico de un circuito o hay un punto en mal estado en ese circuito.",
    symptoms: [
      "Las luces de unas habitaciones no encienden y las de otras sí",
      "Un magnetotérmico del cuadro está bajado",
      "Al subirlo vuelve a bajar",
    ],
    causes: [
      "Cortocircuito en un punto de luz o en un enchufe de ese circuito",
      "Sobrecarga puntual",
      "Portalámparas o regleta en mal estado",
    ],
    urgency: "MEDIA",
    safetySteps: [
      "Identifica qué magnetotérmico está bajado y qué zona controla",
      "No lo subas a la fuerza si vuelve a caer de inmediato",
    ],
    professionalNeeded: "Un electricista, que revisa el circuito afectado punto por punto.",
    relatedProblems: ["salta-el-diferencial", "enchufe-que-chispea"],
  },
  {
    slug: "humedad-en-pared",
    title: "Humedad o moho en una pared",
    trade: "pintura",
    intro:
      "Antes de pintar hay que saber de dónde viene la humedad: una filtración, una fuga, condensación " +
      "o humedad por capilaridad. Tapar la mancha sin tratar la causa solo la retrasa.",
    symptoms: [
      "Mancha oscura o amarillenta que reaparece tras pintar",
      "Moho negro en esquinas, detrás de muebles o en el baño",
      "Pintura que se abomba, se descascarilla o se pulveriza al tocarla",
    ],
    causes: [
      "Filtración desde el exterior, la cubierta o una terraza",
      "Fuga de una tubería próxima",
      "Condensación por falta de ventilación (habitual en baños y dormitorios a fachada norte)",
      "Humedad por capilaridad desde el terreno en plantas bajas",
    ],
    urgency: "BAJA",
    safetySteps: [
      "Ventila a diario la estancia afectada",
      "Haz fotos de la mancha y anota si empeora con la lluvia o con el uso de agua",
    ],
    professionalNeeded:
      "Un profesional de pintura para el saneado y el acabado; si hay fuga, primero un fontanero.",
    insuranceAngle:
      "Si el deterioro viene de un daño por agua cubierto (una fuga, una filtración del vecino), la " +
      "reparación del acabado suele ir asociada al parte.",
    relatedProblems: ["fuga-de-agua"],
  },
  {
    slug: "persiana-rota",
    title: "Persiana rota o que no sube",
    trade: "carpinteria",
    intro:
      "Una persiana que no sube, que se ha salido de las guías o cuya cinta se ha roto suele " +
      "arreglarse en una visita, cambiando la cinta, el recogedor o alguna lama.",
    symptoms: [
      "La cinta gira en vacío y la persiana no sube",
      "La persiana se ha descolgado o atascado en las guías",
      "Lamas dobladas o partidas",
      "Ruido fuerte al subir o bajar",
    ],
    causes: [
      "Cinta desgastada o rota",
      "Recogedor o muelle del eje averiado",
      "Lamas o topes finales dañados",
      "Suciedad o deformación en las guías",
    ],
    urgency: "BAJA",
    safetySteps: [
      "No fuerces la cinta si notas que patina, para no dañar el eje",
      "Si la persiana está a medio bajar y bloqueada, déjala así hasta la visita",
    ],
    professionalNeeded: "Un profesional de carpintería o persianas. Con una foto del cajón y del recogedor se valora la reparación.",
    relatedProblems: ["puerta-que-roza"],
  },
  {
    slug: "puerta-que-roza",
    title: "Una puerta roza o no cierra bien",
    trade: "carpinteria",
    intro:
      "Una puerta que roza el suelo o el marco, que no encaja el pestillo o que se ha descolgado " +
      "suele ajustarse sin cambiar la hoja: bisagras, cerradero o un pequeño rebaje.",
    symptoms: [
      "Hay que empujar o levantar la puerta para cerrarla",
      "El pestillo no entra en el cerradero",
      "La puerta roza el suelo o el marco y deja marca",
      "La puerta se abre o se cierra sola",
    ],
    causes: [
      "Bisagras flojas o descolgadas",
      "Hinchazón de la madera por humedad (frecuente en baños)",
      "Asentamiento del marco o del edificio",
      "Cerradero desalineado",
    ],
    urgency: "BAJA",
    safetySteps: ["Aprieta los tornillos visibles de las bisagras como comprobación previa"],
    professionalNeeded: "Un profesional de carpintería, que ajusta bisagras y cerradero y lija lo justo si hace falta.",
    relatedProblems: ["persiana-rota", "cerradura-atascada"],
  },
  {
    slug: "cerradura-atascada",
    title: "Cerradura atascada o llave que no gira",
    trade: "cerrajeria",
    intro:
      "Una llave que cuesta girar, que se ha partido dentro del bombín o una puerta que se ha " +
      "quedado bloqueada requieren un cerrajero. Si es posible, se abre sin dañar la puerta.",
    symptoms: [
      "La llave entra pero no gira o gira con mucha fuerza",
      "La llave se ha partido dentro de la cerradura",
      "La puerta no abre aunque la llave gira",
      "El bombín se mueve pero no acciona el pestillo",
    ],
    causes: [
      "Bombín desgastado o con suciedad interna",
      "Pestillo o cerradero desalineados por el asentamiento de la puerta",
      "Llave copiada de baja calidad que ha forzado el mecanismo",
      "Mecanismo interno de la cerradura roto",
    ],
    urgency: "MEDIA",
    safetySteps: [
      "No sigas forzando la llave si notas que va a partirse",
      "Si tienes la puerta bloqueada con alguien dentro y hay riesgo, contacta con emergencias (112)",
    ],
    professionalNeeded:
      "Un cerrajero. Si es urgencia con puerta bloqueada, se prioriza y se confirma el coste antes de ir.",
    relatedProblems: ["puerta-que-roza"],
  },
  {
    slug: "lavadora-no-desagua",
    title: "La lavadora no desagua o se queda con agua",
    trade: "electrodomesticos",
    intro:
      "Si la lavadora termina con agua dentro o marca un error de desagüe, casi siempre es la bomba " +
      "o el filtro. Con la marca y el modelo se valora si compensa repararla.",
    symptoms: [
      "Al acabar el programa queda agua y ropa mojada dentro",
      "Marca un código de error de vaciado",
      "Hace ruido al intentar desaguar pero no saca el agua",
      "Desagua muy despacio",
    ],
    causes: [
      "Filtro de la bomba obstruido (monedas, pelusa, objetos pequeños)",
      "Bomba de desagüe averiada",
      "Tubo de desagüe doblado u obstruido",
      "Sensor de nivel defectuoso",
    ],
    urgency: "MEDIA",
    safetySteps: [
      "Desenchufa la lavadora y cierra la llave de paso del agua",
      "Ten a mano una bandeja y trapos: al abrir el filtro sale agua",
    ],
    professionalNeeded: "Un técnico de electrodomésticos, que valora la reparación frente al coste de reponer el aparato.",
    relatedProblems: [],
  },
  {
    slug: "aire-no-enfria",
    title: "El aire acondicionado no enfría",
    trade: "climatizacion",
    intro:
      "Un aire que echa aire pero no enfría, que gotea por dentro o que ha perdido potencia suele " +
      "necesitar mantenimiento, una recarga de gas o la reparación de un componente.",
    symptoms: [
      "Echa aire pero la temperatura no baja",
      "Gotea agua por la unidad interior",
      "Enfría menos que antes o tarda mucho",
      "La unidad exterior hace un ruido raro o no arranca",
    ],
    causes: [
      "Filtros sucios o falta de mantenimiento",
      "Pérdida de gas refrigerante por una fuga en el circuito",
      "Bandeja de condensados o desagüe obstruidos",
      "Avería del compresor o de la electrónica",
    ],
    urgency: "BAJA",
    safetySteps: [
      "Limpia o revisa los filtros de la unidad interior",
      "Anota la marca y el modelo del equipo",
    ],
    professionalNeeded:
      "Un instalador de climatización. La manipulación de gases refrigerantes requiere una persona habilitada.",
    insuranceAngle:
      "Si el equipo ha provocado un daño por agua (una bandeja desbordada que mancha el techo), el " +
      "daño derivado puede entrar en la póliza aunque el aparato no.",
    relatedProblems: [],
  },
  {
    slug: "montaje-de-armario",
    title: "Montaje de un armario o mueble en kit",
    trade: "montaje",
    intro:
      "Un armario de varios cuerpos, una cómoda o una estantería en kit se montan mejor con las " +
      "herramientas y la práctica adecuadas, sobre todo si hay que fijarlo a la pared con seguridad.",
    symptoms: [
      "Tienes el mueble en las cajas y no te atreves a montarlo",
      "No sabes si la pared aguanta la fijación",
      "Un mueble montado se ha quedado inestable o descuadrado",
    ],
    causes: [
      "Instrucciones complejas o piezas mal identificadas",
      "Falta de herramientas o de un segundo par de manos",
      "Tipo de pared que necesita un anclaje específico (pladur, ladrillo hueco, hormigón)",
    ],
    urgency: "BAJA",
    safetySteps: ["Ten localizado el enlace o la foto de la caja del mueble para dar las medidas"],
    professionalNeeded:
      "Un montador. Deja el mueble montado, nivelado y fijado a la pared con el anclaje correcto según el tabique.",
    relatedProblems: [],
  },
];

const BY_SLUG = new Map(PROBLEMS.map((p) => [p.slug, p]));

export const PROBLEM_SLUGS = PROBLEMS.map((p) => p.slug);

export function problemBySlug(slug: string): Problem | undefined {
  return BY_SLUG.get(slug);
}

export function problemsForTrade(trade: string): Problem[] {
  return PROBLEMS.filter((p) => p.trade === trade);
}

export { PROBLEMS };
