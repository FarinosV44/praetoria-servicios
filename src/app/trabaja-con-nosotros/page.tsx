import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/ui";
import { COPY } from "@/config/copy";
import { breadcrumbLd } from "@/lib/seo";
import { ApplicationForm } from "./ApplicationForm";
import styles from "../servicios/servicios.module.css";

export const metadata: Metadata = {
  title: "Trabaja con Praetoria",
  description:
    "Somos fontaneros, electricistas, pintores, montadores y otros oficios que quieren dedicar el " +
    "tiempo a ejecutar, no a filtrar llamadas. Praetoria organiza solicitudes claras y reduce " +
    "visitas improductivas. Déjanos tus datos.",
  alternates: { canonical: "/trabaja-con-nosotros" },
  openGraph: {
    title: `Trabaja con Praetoria · ${COPY.brand.name}`,
    description: "Recibe solicitudes ya interpretadas y con contexto. Sin portal, sin ataduras.",
    type: "website",
    locale: "es_ES",
  },
};

export default function TrabajaConNosotrosPage() {
  return (
    <main id="contenido" className={styles.page}>
      <JsonLd
        data={breadcrumbLd([
          { name: "Inicio", path: "/" },
          { name: "Trabaja con nosotros", path: "/trabaja-con-nosotros" },
        ])}
      />
      <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link> / Trabaja con nosotros
      </nav>

      <h1 className={styles.title}>Trabaja con Praetoria</h1>
      <p className={styles.intro}>
        Praetoria recoge la incidencia del cliente, la interpreta con fotos y lenguaje natural, filtra
        la información y prepara una solicitud clara. Tú te concentras en ejecutar el trabajo con el
        contexto ya resuelto y menos visitas en balde.
      </p>

      <section className={styles.section} aria-labelledby="que-no">
        <h2 id="que-no" className={styles.h2}>
          Qué no te prometemos
        </h2>
        <p>
          No prometemos un volumen mínimo de trabajo ni exclusividad. Tampoco pedimos documentación
          sensible en este primer contacto: si encajamos, lo hablamos con calma. En este punto no hay
          plataforma ni acceso a ningún sistema para profesionales: es sólo una toma de contacto.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="form">
        <h2 id="form" className={styles.h2}>
          Déjanos tus datos
        </h2>
        <ApplicationForm />
      </section>

      <p className={styles.disclaimer}>{COPY.landing.footer.note}</p>
    </main>
  );
}
