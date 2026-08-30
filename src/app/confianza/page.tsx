import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, JsonLd } from "@/ui";
import { COPY } from "@/config/copy";
import { TRUST_CHARTER } from "@/config/trust-charter";
import { breadcrumbLd } from "@/lib/seo";
import styles from "./confianza.module.css";

export const metadata: Metadata = {
  title: "Carta de Confianza Praetoria",
  description:
    "Qué controla Praetoria, qué recibes por escrito y qué ocurre si algo sale mal. Cada compromiso " +
    "corresponde a un proceso real. Se lee en menos de dos minutos.",
  alternates: { canonical: "/confianza" },
  openGraph: {
    title: `Carta de Confianza · ${COPY.brand.name}`,
    description: "Compromisos verificables, no promesas genéricas.",
    type: "website",
    locale: "es_ES",
  },
};

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(iso));

export default function ConfianzaPage() {
  const c = TRUST_CHARTER;
  return (
    <main id="contenido" className={styles.page}>
      <JsonLd
        data={breadcrumbLd([
          { name: "Inicio", path: "/" },
          { name: "Carta de Confianza", path: "/confianza" },
        ])}
      />
      <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link> / Carta de Confianza
      </nav>

      <h1 className={styles.title}>Carta de Confianza Praetoria</h1>
      <p className={styles.meta}>
        Versión {c.version} · en vigor desde el {fmtDate(c.effectiveDate)} · {c.readingTimeNote}
      </p>

      <p>
        <span className={styles.seal}>✓ Gestionado por Praetoria</span>
      </p>
      <p className={styles.sealNote}>{c.sealNote}</p>

      <p>
        Praetoria se diferencia por tener <strong>un único interlocutor</strong>, darte{" "}
        <strong>información por escrito</strong> y <strong>controlar el proceso</strong> — no por
        cifras ni promesas que todavía no podamos demostrar. Estos son nuestros compromisos y lo que
        los hace posibles:
      </p>

      {c.commitments.map((item) => (
        <div key={item.id} className={styles.commitment}>
          <h2>{item.title}</h2>
          <p>{item.body}</p>
          <p className={styles.backing}>
            <strong>Cómo lo hacemos posible:</strong> {item.backing}
          </p>
        </div>
      ))}

      <div className={styles.split}>
        <section aria-labelledby="presta-praetoria">
          <h2 id="presta-praetoria">Qué presta Praetoria</h2>
          <ul>
            {c.praetoriaProvides.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="ejecuta-profesional">
          <h2 id="ejecuta-profesional">Qué ejecuta el profesional</h2>
          <ul>
            {c.professionalExecutes.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className={styles.costs}>
        <h2>Costes posibles, antes de que aceptes nada</h2>
        <ul>
          {c.preAcceptanceCosts.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>

      <p className={styles.meta}>
        Si actualizamos esta carta, la nueva versión se aplica a las solicitudes futuras. Las
        solicitudes ya aceptadas conservan la versión que estaba en vigor cuando las aceptaste.
      </p>

      <div className={styles.cta}>
        <ButtonLink href="/solicitar" size="lg">
          {COPY.assistant.startCta}
        </ButtonLink>
      </div>
    </main>
  );
}
