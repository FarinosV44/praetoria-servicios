/**
 * Geographic coverage (EPIC #1, issues #4, #18, #25).
 * "La cobertura se validará mediante municipio/código postal configurable,
 *  sin listas rígidas dispersas por el código."
 *
 * Single source of truth. A municipality is served if it is listed here OR the
 * postal code falls in a served range. Keep this list honest — issue #25 forbids
 * claiming coverage that is not real.
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
];

const norm = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export interface CoverageCheck {
  covered: boolean;
  matchedBy: "municipality" | "postalCode" | null;
  area: CoverageArea | null;
}

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
  return { covered: false, matchedBy: null, area: null };
}

export const COVERED_MUNICIPALITIES = COVERAGE.map((a) => a.municipality);
