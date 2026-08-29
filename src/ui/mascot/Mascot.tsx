import { cn } from "../cn";
import styles from "./Mascot.module.css";

/**
 * Praetoria's emotional character (issue #3). A calm, friendly face that moves
 * through the emotional arc: worry → progress → relief. Vector, tiny, no layout
 * shift. Animation is a gentle breathing motion, disabled under reduced-motion
 * via the tokens.
 */

export type MascotMood = "worry" | "progress" | "relief" | "neutral";

const MOUTHS: Record<MascotMood, React.ReactNode> = {
  worry: <path d="M9 15.5c1-1 5-1 6 0" strokeLinecap="round" />,
  progress: <path d="M9 15h6" strokeLinecap="round" />,
  relief: <path d="M9 14.5c1 1.6 5 1.6 6 0" strokeLinecap="round" />,
  neutral: <path d="M9.5 15h5" strokeLinecap="round" />,
};

const BROWS: Record<MascotMood, React.ReactNode> = {
  worry: (
    <>
      <path d="M7.5 9.2 10 8.2" strokeLinecap="round" />
      <path d="M16.5 9.2 14 8.2" strokeLinecap="round" />
    </>
  ),
  progress: (
    <>
      <path d="M7.5 8.6h2.2" strokeLinecap="round" />
      <path d="M14.3 8.6h2.2" strokeLinecap="round" />
    </>
  ),
  relief: (
    <>
      <path d="M7.6 8.4 9.8 8.9" strokeLinecap="round" />
      <path d="M16.4 8.4 14.2 8.9" strokeLinecap="round" />
    </>
  ),
  neutral: (
    <>
      <path d="M7.6 8.6h2.1" strokeLinecap="round" />
      <path d="M14.3 8.6h2.1" strokeLinecap="round" />
    </>
  ),
};

const TONE: Record<MascotMood, string> = {
  worry: "var(--c-state-worry)",
  progress: "var(--c-state-progress)",
  relief: "var(--c-state-relief)",
  neutral: "var(--c-accent)",
};

export function Mascot({
  mood = "neutral",
  size = 72,
  className,
  label,
}: {
  mood?: MascotMood;
  size?: number;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      className={cn(styles.mascot, className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={label ? "img" : "presentation"}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      {label && <title>{label}</title>}
      <circle cx="12" cy="12" r="9.5" fill={TONE[mood]} opacity="0.14" />
      <circle
        cx="12"
        cy="12"
        r="8.2"
        fill="var(--c-surface)"
        stroke={TONE[mood]}
        strokeWidth="1.4"
      />
      <g stroke="var(--c-text)" strokeWidth="1.4" fill="none">
        {BROWS[mood]}
        {MOUTHS[mood]}
      </g>
      <circle cx="9.4" cy="11.4" r="1" fill="var(--c-text)" />
      <circle cx="14.6" cy="11.4" r="1" fill="var(--c-text)" />
    </svg>
  );
}
