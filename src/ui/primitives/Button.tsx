import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "../cn";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

export type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

export type ButtonLinkProps = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

function classes({ variant = "primary", size = "md", fullWidth, loading }: CommonProps) {
  return cn(
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, fullWidth, loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(classes({ variant, size, fullWidth, loading }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span className={styles.label}>{children}</span>
    </button>
  );
});

export function ButtonLink({
  variant,
  size,
  fullWidth,
  loading,
  className,
  children,
  href,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(classes({ variant, size, fullWidth, loading }), className)}
      {...rest}
    >
      <span className={styles.label}>{children}</span>
    </Link>
  );
}
