import type { Metadata } from "next";
import { clientLinkService } from "@/server/services/clientLink";
import { photoService } from "@/server/services/photos";
import { insuranceService } from "@/server/services/insurance";
import { ClientStatusView } from "./ClientStatusView";
import { InsuranceSection } from "./InsuranceSection";
import { RecoverAccess } from "./RecoverAccess";
import styles from "./link.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estado de tu solicitud · Praetoria Servicios",
  description: "Consulta el estado de tu solicitud y responde de forma segura.",
  robots: { index: false, follow: false },
};

export default async function ClientLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = await clientLinkService.resolve(token);

  if (!link.ok) {
    const reason =
      link.error.kind === "expired"
        ? "Este enlace ha caducado."
        : link.error.kind === "revoked"
          ? "Este enlace ya no es válido."
          : "No hemos podido abrir este enlace.";
    return (
      <main id="contenido" className={styles.page}>
        <div className={styles.card}>
          <h1>Acceso al estado de tu solicitud</h1>
          <p>{reason}</p>
          <p>
            Puedes recuperar el acceso con la referencia de tu solicitud y los últimos 4 dígitos de
            tu teléfono.
          </p>
          <RecoverAccess />
        </div>
      </main>
    );
  }

  const view = await clientLinkService.getClientView(link.value.requestId);
  if (!view) {
    return (
      <main id="contenido" className={styles.page}>
        <div className={styles.card}>
          <h1>Solicitud no encontrada</h1>
          <p>No hemos podido cargar esta solicitud.</p>
        </div>
      </main>
    );
  }

  const photos = view.canAddInfo ? await photoService.list(link.value.requestId) : [];
  const insuranceCase = await insuranceService.getCase(link.value.requestId);

  return (
    <main id="contenido" className={styles.page}>
      <ClientStatusView
        token={token}
        view={{
          ...view,
          submittedAt: view.submittedAt ? view.submittedAt.toISOString() : null,
          quote: view.quote
            ? {
                ...view.quote,
                scheduledFor: view.quote.scheduledFor
                  ? view.quote.scheduledFor.toISOString()
                  : null,
                validUntil: view.quote.validUntil ? view.quote.validUntil.toISOString() : null,
              }
            : null,
        }}
        photos={photos.map((p) => ({ id: p.id, signedUrl: p.signedUrl }))}
      />

      <InsuranceSection
        token={token}
        consentGiven={insuranceCase?.consentGiven ?? false}
        status={insuranceCase?.extractionStatus ?? null}
        insurerName={insuranceCase?.insurerName ?? null}
        policyNumber={insuranceCase?.policyNumber ?? null}
        missingDocsNote={insuranceCase?.missingDocsNote ?? null}
        documents={(insuranceCase?.documents ?? []).map((d) => ({
          id: d.id,
          kindLabel: d.kindLabel,
          ocrUsed: d.ocrUsed,
          pageCount: d.pageCount,
        }))}
      />
    </main>
  );
}
