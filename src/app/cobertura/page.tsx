import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/ui";
import { COPY } from "@/config/copy";
import { COVERAGE } from "@/config/coverage";
import { breadcrumbLd } from "@/lib/seo";
import { CoverageChecker } from "./CoverageChecker";
import styles from "./cobertura.module.css";

export const metadata: Metadata = {
  title: "Cobertura: toda el área de Valencia",
  description:
    "Praetoria Servicios trabaja en toda el área de Valencia: la ciudad y los municipios cercanos. " +
    "Comprueba tu zona por código postal.",
  alternates: { canonical: "/cobertura" },
  openGraph: {
    title: `Dónde trabajamos · ${COPY.brand.name}`,
    description: "Toda el área de Valencia: la ciudad y los municipios cercanos.",
    type: "website",
    locale: "es_ES",
  },
};

export default function CoberturaPage() {
  return (
    <main id="contenido" className={styles.page}>
      <JsonLd
        data={breadcrumbLd([
          { name: "Inicio", path: "/" },
          { name: "Cobertura", path: "/cobertura" },
        ])}
      />
      <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link> / Cobertura
      </nav>

      <h1 className={styles.title}>Dónde trabajamos</h1>
      <p className={styles.intro}>
        Praetoria Servicios da servicio en toda el área de Valencia: la ciudad y los municipios
        cercanos. Comprueba tu zona por código postal; la disponibilidad exacta se confirma al
        preparar el presupuesto.
      </p>

      <CoverageChecker />

      <section className={styles.section} aria-labelledby="municipios">
        <h2 id="municipios" className={styles.h2}>
          Municipios con cobertura confirmada
        </h2>
        <p>
          Ya trabajamos de forma habitual en estos municipios. En el resto del área de Valencia
          también damos servicio, confirmando la disponibilidad al presupuestar.
        </p>
        <ul className={styles.areas}>
          {COVERAGE.map((area) => (
            <li key={area.municipality} className={styles.area}>
              <strong>{area.municipality}</strong>
              <span>
                {area.postalCodes.join(", ")}
                {area.note ? ` · ${area.note}` : ""}
              </span>
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          En polígonos industriales y urbanizaciones aisladas la disponibilidad puede variar. Lo
          confirmamos al preparar el presupuesto.
        </p>
      </section>

      <p className={styles.disclaimer}>{COPY.landing.footer.note}</p>
    </main>
  );
}
