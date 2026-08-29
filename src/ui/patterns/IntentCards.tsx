import { Icon, type IconName } from "../icons/Icon";
import styles from "./IntentCards.module.css";

/**
 * The three intent entry points (benchmark D1, issue #5). NOT a grid of trades —
 * the first choice is by intent, and "no sé qué profesional necesito" lives
 * inside "avería o problema" as the primary path.
 */

export type Intent = "problema" | "trabajo" | "seguro";

const OPTIONS: { key: Intent; icon: IconName; title: string; description: string }[] = [
  {
    key: "problema",
    icon: "problema",
    title: "Tengo una avería o un problema",
    description: "Algo se ha roto, gotea, no funciona… No hace falta que sepas a quién llamar.",
  },
  {
    key: "trabajo",
    icon: "montaje",
    title: "Necesito hacer un trabajo en casa",
    description: "Montar, instalar, pintar, reformar una zona concreta.",
  },
  {
    key: "seguro",
    icon: "seguro",
    title: "Quiero comprobar si lo cubre mi seguro",
    description: "Subes tu póliza y te damos una orientación antes de pagar nada.",
  },
];

export function IntentCards({ onSelect }: { onSelect: (intent: Intent) => void }) {
  return (
    <ul className={styles.list}>
      {OPTIONS.map((o) => (
        <li key={o.key}>
          <button type="button" className={styles.card} onClick={() => onSelect(o.key)}>
            <span className={styles.icon} aria-hidden="true">
              <Icon name={o.icon} size={28} />
            </span>
            <span className={styles.text}>
              <span className={styles.title}>{o.title}</span>
              <span className={styles.description}>{o.description}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
