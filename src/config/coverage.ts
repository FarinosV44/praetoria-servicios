/**
 * Geographic coverage (EPIC #1, issues #4, #18, #25).
 * "La cobertura se validará mediante municipio/código postal configurable,
 *  sin listas rígidas dispersas por el código."
 *
 * Operator decision (D-013): Praetoria da servicio en TODA el área de Valencia
 * — la ciudad y los municipios cercanos. `COVERAGE` es la lista de municipios
 * con cobertura CONFIRMADA (se muestran como ejemplos y dan una respuesta sin
 * matices); cualquier otro código postal de la provincia de Valencia (`46xxx`)
 * se considera "dentro del área", con la disponibilidad exacta confirmada al
 * preparar el presupuesto. Esto sigue siendo honesto (issue #25): es el
 * compromiso real del operador, no una afirmación inventada.
 */

export interface CoverageArea {
  municipality: string;
  /** postal codes fully served */
  postalCodes: string[];
  /** orientative response note shown on the coverage page */
  note?: string;
}

export const COVERAGE: readonly CoverageArea[] = [
  {
    municipality: "Valencia",
    postalCodes: [
      "46001",
      "46002",
      "46003",
      "46004",
      "46005",
      "46006",
      "46007",
      "46008",
      "46009",
      "46010",
      "46011",
      "46013",
      "46014",
      "46015",
      "46017",
      "46018",
      "46019",
      "46020",
      "46021",
      "46022",
      "46023",
      "46024",
      "46025",
      "46035",
    ],
  },
  { municipality: "Burjassot", postalCodes: ["46100"] },
  { municipality: "Godella", postalCodes: ["46110"] },
  { municipality: "Rocafort", postalCodes: ["46111"] },
  { municipality: "Moncada", postalCodes: ["46113"] },
  { municipality: "Alfara del Patriarca", postalCodes: ["46115"] },
  { municipality: "Vinalesa", postalCodes: ["46114"] },
  { municipality: "Foios", postalCodes: ["46134"] },
  { municipality: "Meliana", postalCodes: ["46133"] },
  { municipality: "Almàssera", postalCodes: ["46132"] },
  { municipality: "Tavernes Blanques", postalCodes: ["46016"] },
  { municipality: "Bonrepòs i Mirambell", postalCodes: ["46131"] },
  {
    municipality: "Paterna",
    postalCodes: ["46980", "46988"],
    note: "Zonas urbanas; polígonos según disponibilidad",
  },
  { municipality: "Alboraya", postalCodes: ["46120"] },
  { municipality: "Rafelbunyol", postalCodes: ["46138"] },
  { municipality: "La Pobla de Farnals", postalCodes: ["46137"] },
  { municipality: "El Puig de Santa Maria", postalCodes: ["46540"] },
  { municipality: "Puçol", postalCodes: ["46530"] },
  {
    municipality: "Sagunto",
    postalCodes: ["46500", "46520"],
    note: "Sagunto y Puerto de Sagunto; borde norte de la cobertura, según disponibilidad",
  },
];

const norm = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export interface CoverageCheck {
  covered: boolean;
  /** `postalCode`/`municipality` = confirmed list match; `area` = within the wider Valencia area */
  matchedBy: "municipality" | "postalCode" | "area" | null;
  area: CoverageArea | null;
}

/** Province of Valencia postal codes — the "área de Valencia" for D-013. */
const VALENCIA_PROVINCE_PC = /^46\d{3}$/;

export function checkCoverage(input: {
  municipality?: string | null;
  postalCode?: string | null;
}): CoverageCheck {
  const muni = input.municipality ? norm(input.municipality) : null;
  const pc = input.postalCode?.trim() ?? null;

  if (pc) {
    const area = COVERAGE.find((a) => a.postalCodes.includes(pc));
    if (area) return { covered: true, matchedBy: "postalCode", area };
  }
  if (muni) {
    const area = COVERAGE.find((a) => norm(a.municipality) === muni);
    if (area) return { covered: true, matchedBy: "municipality", area };
  }
  // Wider Valencia area: any province postal code counts as within coverage,
  // with exact availability confirmed at quote time (D-013).
  if (pc && VALENCIA_PROVINCE_PC.test(pc)) {
    return { covered: true, matchedBy: "area", area: null };
  }
  return { covered: false, matchedBy: null, area: null };
}

export const COVERED_MUNICIPALITIES = COVERAGE.map((a) => a.municipality);
