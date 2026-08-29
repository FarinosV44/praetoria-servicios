import { Icon } from "../icons/Icon";
import { TRADES } from "@/config/trades";
import styles from "./TradeCards.module.css";

/**
 * Trade category picker (issue #5). "No sé qué profesional necesito" is the
 * primary path, shown first and visually distinct.
 */
export function TradeCards({ onSelect }: { onSelect: (key: string) => void }) {
  return (
    <div>
      <button type="button" className={styles.unsure} onClick={() => onSelect("no-se")}>
        <Icon name="no-se" size={26} />
        <span>No sé qué profesional necesito</span>
      </button>
      <ul className={styles.grid}>
        {TRADES.map((t) => (
          <li key={t.key}>
            <button type="button" className={styles.card} onClick={() => onSelect(t.key)}>
              <Icon name={t.key as never} size={26} />
              <span className={styles.label}>{t.label}</span>
              <span className={styles.hint}>{t.hint}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
