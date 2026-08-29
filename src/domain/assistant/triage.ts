/**
 * Immediate safety triage (benchmark D2, issue #5). Shown right after the intent
 * step. Praetoria does not claim 24/7 urgent attention — the triage gives brief
 * safe instructions and points to emergency services.
 */

export interface TriageRisk {
  key: string;
  label: string;
  instructions: string[];
}

export const TRIAGE_RISKS: readonly TriageRisk[] = [
  {
    key: "agua",
    label: "Hay agua descontrolada o una fuga importante",
    instructions: [
      "Cierra la llave de paso general si puedes llegar a ella con seguridad.",
      "Aparta enchufes múltiples y aparatos eléctricos de la zona mojada.",
    ],
  },
  {
    key: "gas",
    label: "Huele a gas",
    instructions: [
      "No enciendas ni apagues luces ni aparatos. No uses el móvil dentro de casa.",
      "Abre ventanas, cierra la llave del gas y sal del domicilio.",
      "Avisa a la compañía de gas o a emergencias desde fuera.",
    ],
  },
  {
    key: "electrico",
    label: "Chispas, humo, olor a quemado o riesgo eléctrico",
    instructions: [
      "Baja el interruptar general del cuadro eléctrico si puedes hacerlo con seguridad.",
      "No toques cables ni enchufes con las manos húmedas.",
    ],
  },
  {
    key: "fuego",
    label: "Hay fuego o mucho humo",
    instructions: ["Sal del domicilio y llama al 112 desde un lugar seguro."],
  },
  {
    key: "encerrada",
    label: "Hay una persona o un animal encerrado",
    instructions: [
      "Si hay riesgo para la persona (calor, falta de aire, menor solo), llama al 112.",
    ],
  },
  {
    key: "estructural",
    label: "Grietas nuevas, techo que cede o riesgo de derrumbe",
    instructions: [
      "Aleja a las personas de la zona afectada.",
      "Si el riesgo es inminente, llama al 112 o a los bomberos.",
    ],
  },
] as const;

export function instructionsFor(keys: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of keys) {
    const risk = TRIAGE_RISKS.find((r) => r.key === k);
    if (!risk) continue;
    for (const line of risk.instructions) {
      if (!seen.has(line)) {
        seen.add(line);
        out.push(line);
      }
    }
  }
  return out;
}

export const EMERGENCY_KEYS = ["gas", "fuego", "estructural"] as const;

/** True when the selected risks warrant stopping the flow and calling 112 first. */
export function isEmergency(keys: string[]): boolean {
  return keys.some((k) => (EMERGENCY_KEYS as readonly string[]).includes(k));
}
