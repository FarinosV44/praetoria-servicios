import { forwardRef, useId } from "react";
import { cn } from "../cn";
import styles from "./Field.module.css";

interface FieldBase {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

export type TextFieldProps = FieldBase &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> & { as?: "input" };

export type TextAreaFieldProps = FieldBase &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & { as: "textarea" };

export const Field = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  TextFieldProps | TextAreaFieldProps
>(function Field({ label, hint, error, required, className, as = "input", ...rest }, ref) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn(styles.field, error && styles.hasError, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && (
          <span className={styles.req} aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {as === "textarea" ? (
        <textarea
          id={id}
          ref={ref as React.Ref<HTMLTextAreaElement>}
          className={styles.control}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={id}
          ref={ref as React.Ref<HTMLInputElement>}
          className={styles.control}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error && (
        <p id={errId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
