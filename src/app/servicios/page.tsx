import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/ui";
import { COPY } from "@/config/copy";
import { SERVICE_TRADES, serviceContentFor } from "@/config/service-content";
import { breadcrumbLd } from "@/lib/seo";
import styles from "./servicios.module.css";

export const metadata: Metadata = {
  title: "Servicios para el hogar en Valencia",
  description:
    "Fontanería, electricidad, electrodomésticos, montaje, carpintería, pintura, climatización, " +
    "cerrajería y más. Explica el problema con fotos y te damos presupuesto y plazo en menos de 24 h.",
  alternates: { canonical: "/servicios" },
  openGraph: {
    title: `Servicios para el hogar · ${COPY.brand.name}`,
    description:
      "Un servicio gestionado: interpretamos la incidencia, elegimos al profesional y preparamos " +
      "un presupuesto claro.",
    type: "website",
    locale: "es_ES",
  },
};

export default function ServiciosIndexPage() {
  return (
    <main id="contenido" className={styles.page}>
      <JsonLd
        data={breadcrumbLd([
          { name: "Inicio", path: "/" },
          { name: "Servicios", path: "/servicios" },
        ])}
      />
      <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link> / Servicios
      </nav>

      <h1 className={styles.title}>Servicios para el hogar</h1>
      <p className={styles.intro}>
        Trabajamos en Valencia y los municipios del norte del área metropolitana. No necesitas saber
        qué profesional te hace falta: describe el problema y nosotros lo identificamos.
      </p>

      <ul className={styles.index}>
        {SERVICE_TRADES.map((t) => (
          <li key={t.key}>
            <Link href={`/servicios/${t.key}`} className={styles.indexCard}>
              <h2>{t.label}</h2>
              <p>{serviceContentFor(t.key).intro}</p>
            </Link>
          </li>
        ))}
      </ul>

      <p className={styles.disclaimer}>{COPY.landing.footer.note}</p>
    </main>
  );
}
