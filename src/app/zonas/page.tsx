import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/ui";
import { COPY } from "@/config/copy";
import { COVERED_MUNICIPALITIES } from "@/config/coverage";
import { localPageService } from "@/server/services/localPage";
import { breadcrumbLd } from "@/lib/seo";
import { safe } from "@/lib/safe";
import styles from "../servicios/servicios.module.css";

export const metadata: Metadata = {
  title: "Zonas donde trabajamos",
  description:
    "Valencia y los municipios del norte del área metropolitana. Consulta las páginas de zona con " +
    "información concreta de cobertura, tiempos de respuesta y trabajos realizados.",
  alternates: { canonical: "/zonas" },
  openGraph: {
    title: `Zonas de servicio · ${COPY.brand.name}`,
    description: "Dónde trabajamos y qué ofrecemos en cada municipio.",
    type: "website",
    locale: "es_ES",
  },
};

export default async function ZonasIndexPage() {
  const pages = await safe(() => localPageService.listPublished(), [], "zonas.list");

  return (
    <main id="contenido" className={styles.page}>
      <JsonLd
        data={breadcrumbLd([
          { name: "Inicio", path: "/" },
          { name: "Zonas", path: "/zonas" },
        ])}
      />
      <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link> / Zonas
      </nav>

      <h1 className={styles.title}>Zonas donde trabajamos</h1>
      <p className={styles.intro}>
        Damos servicio en toda el área de Valencia: la ciudad y los municipios cercanos, con la
        disponibilidad exacta confirmada al preparar el presupuesto.
      </p>

      {pages.length > 0 && (
        <section className={styles.section} aria-labelledby="paginas-zona">
          <h2 id="paginas-zona" className={styles.h2}>
            Páginas de zona
          </h2>
          <ul className={styles.index}>
            {pages.map((z) => (
              <li key={z.slug}>
                <Link href={`/zonas/${z.slug}`} className={styles.indexCard}>
                  <h3>{z.municipality}</h3>
                  {z.intro && <p>{z.intro}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section} aria-labelledby="cobertura-confirmada">
        <h2 id="cobertura-confirmada" className={styles.h2}>
          Municipios con cobertura confirmada
        </h2>
        <ul className={styles.list}>
          {COVERED_MUNICIPALITIES.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <p>
          <Link href="/cobertura">Comprueba tu código postal</Link>.
        </p>
      </section>

      <p className={styles.disclaimer}>{COPY.landing.footer.note}</p>
    </main>
  );
}
