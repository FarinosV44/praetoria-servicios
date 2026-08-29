import { cn } from "../cn";
import styles from "./Card.module.css";

export function Card({
  as: As = "div",
  interactive,
  className,
  children,
  ...rest
}: {
  as?: React.ElementType;
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <As className={cn(styles.card, interactive && styles.interactive, className)} {...rest}>
      {children}
    </As>
  );
}
