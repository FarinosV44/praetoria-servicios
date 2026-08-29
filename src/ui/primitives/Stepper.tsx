import { cn } from "../cn";
import styles from "./Stepper.module.css";

export interface Step {
  key: string;
  label: string;
}

/**
 * Progress indicator for the assistant (issue #5). Shows real position — never a
 * faked percentage. `current` is the index of the active step.
 */
export function Stepper({
  steps,
  current,
  className,
}: {
  steps: Step[];
  current: number;
  className?: string;
}) {
  return (
    <nav className={cn(styles.stepper, className)} aria-label="Progreso de la solicitud">
      <ol className={styles.list}>
        {steps.map((step, i) => {
          const state = i < current ? "done" : i === current ? "current" : "todo";
          return (
            <li key={step.key} className={cn(styles.step, styles[state])}>
              <span className={styles.marker} aria-hidden="true">
                {state === "done" ? "✓" : i + 1}
              </span>
              <span className={styles.label}>
                {step.label}
                {state === "current" && <span className={styles.srOnly}> (paso actual)</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <p className={styles.count}>
        Paso {Math.min(current + 1, steps.length)} de {steps.length}
      </p>
    </nav>
  );
}
