/**
 * The trade catalogue (issue #5). Editable configuration, not scattered magic strings.
 * `key` is stable and stored; `label` is the Spanish display name.
 */
export interface Trade {
  key: string;
  label: string;
  /** short guidance shown on the category card */
  hint: string;
}

export const TRADES: readonly Trade[] = [
  { key: "fontaneria", label: "Fontanería", hint: "Fugas, grifos, desagües, calentador" },
  { key: "electricidad", label: "Electricidad", hint: "Enchufes, cuadro, luces, cortocircuitos" },
  {
    key: "electrodomesticos",
    label: "Electrodomésticos",
    hint: "Lavadora, nevera, horno, secadora",
  },
  { key: "montaje", label: "Montaje", hint: "Muebles, estanterías, cortinas, TV" },
  {
    key: "carpinteria",
    label: "Carpintería",
    hint: "Puertas, armarios, madera, cerraduras de mueble",
  },
  { key: "pintura", label: "Pintura", hint: "Paredes, techos, humedades a tratar" },
  { key: "jardineria", label: "Jardinería", hint: "Poda, riego, mantenimiento de plantas" },
  { key: "limpieza", label: "Limpieza", hint: "Limpiezas puntuales o a fondo" },
  { key: "mudanzas", label: "Mudanzas", hint: "Traslados, embalaje, transporte" },
  {
    key: "climatizacion",
    label: "Climatización",
    hint: "Aire acondicionado, calefacción, radiadores",
  },
  { key: "cerrajeria", label: "Cerrajería", hint: "Cerraduras, llaves, puertas bloqueadas" },
] as const;

export const UNSURE_KEY = "no-se" as const;

export function findTrade(key: string | null | undefined): Trade | undefined {
  if (!key) return undefined;
  return TRADES.find((t) => t.key === key);
}

export function isKnownTrade(key: string): boolean {
  return TRADES.some((t) => t.key === key);
}
