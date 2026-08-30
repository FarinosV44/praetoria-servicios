import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/ui";
import { COPY } from "@/config/copy";
import { CONTENT } from "@/config/content";
import { contentService } from "@/server/services/content";
import { breadcrumbLd } from "@/lib/seo";
import styles from "@/ui/content/content.module.css";

export const metadata: Metadata = {
  title: "Guías y consejos para el hogar",
  description:
    "Guías prácticas sobre fugas, electricidad, humedades, seguros del hogar y mantenimiento, " +
    "escritas y revisadas por el equipo de Praetoria.",
  alternates: { canonical: "/guias" },
};

export default async function GuiasIndex() {
  const articles = await contentService.listPublished();

  return (
    <main id="contenido" className={styles.page}>
      <JsonLd
        data={breadcrumbLd([
          { name: "Inicio", path: "/" },
          { name: "Guías", path: "/guias" },
        ])}
      />
      <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link> / Guías
      </nav>
      <h1 className={styles.title}>Guías y consejos</h1>
      <p className={styles.meta}>
        Contenido original del equipo de Praetoria. Nada generado automáticamente sin revisión humana.
      </p>

      {articles.length === 0 ? (
        <p>Todavía no hay guías publicadas.</p>
      ) : (
        <ul className={styles.index}>
          {articles.map((a) => (
            <li key={a.slug}>
              <Link href={`/guias/${a.slug}`} className={styles.card}>
                <span className={styles.kind}>{CONTENT.kindLabel[a.kind]}</span>
                <h2>{a.title}</h2>
                {a.excerpt && <p>{a.excerpt}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p style={{ marginTop: "2rem" }}>
        <Link href="/solicitar">{COPY.assistant.startCta}</Link>
      </p>
    </main>
  );
}
