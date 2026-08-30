import { findTrade } from "@/config/trades";
import styles from "./link.module.css";

/**
 * The professional assigned to this request, shown to the client BEFORE the
 * visit (issue #22 / D6). Minimal and honest: name, trade, the real scope of
 * what was verified, and the photo only when the professional consented.
 */
export function AssignedProfessional({
  professional,
}: {
  professional: {
    displayName: string;
    trades: string[];
    verifiedScope: string[];
    isVerified: boolean;
    photoUrl: string | null;
  } | null;
}) {
  if (!professional) return null;

  return (
    <section className={styles.card}>
      <h2>Tu profesional</h2>
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
        {professional.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={professional.photoUrl}
            alt={`Foto de ${professional.displayName}`}
            width={72}
            height={72}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        )}
        <div>
          <p>
            <strong>{professional.displayName}</strong>
          </p>
          <p>{professional.trades.map((t) => findTrade(t)?.label ?? t).join(", ")}</p>
          {professional.isVerified ? (
            <p>
              Verificado por Praetoria: {professional.verifiedScope.join(", ")}.
            </p>
          ) : (
            <p>
              Verificación en curso. Solo indicamos “verificado” cuando comprobamos identidad,
              documentación o seguro — nunca por tener solo un teléfono.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
