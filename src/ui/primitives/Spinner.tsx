import styles from "./Spinner.module.css";

/** Accessible loading indicator. Provide a meaningful `label`. */
export function Spinner({ label = "Cargando…", inline }: { label?: string; inline?: boolean }) {
  return (
    <span className={inline ? styles.inline : styles.block} role="status">
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
}
