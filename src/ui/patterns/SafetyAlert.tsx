import { Icon } from "../icons/Icon";
import styles from "./SafetyAlert.module.css";

/**
 * High-contrast safety alert (benchmark D2, issues #5, #23). Shown when the
 * assistant's triage detects a risk (uncontrolled water, gas, smoke/sparks,
 * electrical risk, person locked in, structural risk). Gives brief safe
 * instructions and points to emergency services — Praetoria does not claim 24/7
 * urgent attention.
 */
export function SafetyAlert({
  heading,
  instructions,
  emergencyNote = "Si hay peligro inmediato, llama al 112.",
}: {
  heading: string;
  instructions: string[];
  emergencyNote?: string;
}) {
  return (
    <div className={styles.alert} role="alert">
      <div className={styles.icon} aria-hidden="true">
        <Icon name="aviso" size={28} />
      </div>
      <div>
        <p className={styles.heading}>{heading}</p>
        <ul className={styles.list}>
          {instructions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className={styles.emergency}>{emergencyNote}</p>
      </div>
    </div>
  );
}
