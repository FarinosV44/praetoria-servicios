import Link from "next/link";
import { COPY } from "@/config/copy";
import styles from "./legal.module.css";

/**
 * Shared renderer for the provisional legal pages (issue #4). The definitive
 * texts are issue #17 — the banner makes that explicit on every page.
 */
export function LegalDoc({
  doc,
}: {
  doc: {
    title: string;
    intro: string;
    sections: readonly { readonly h: string; readonly p: string }[];
  };
}) {
  return (
    <main id="contenido" className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Volver al inicio
      </Link>
      <h1>{doc.title}</h1>
      <p className={styles.banner}>{COPY.legal.provisionalBanner}</p>
      <p className={styles.intro}>{doc.intro}</p>
      {doc.sections.map((s) => (
        <section key={s.h} className={styles.section}>
          <h2>{s.h}</h2>
          <p>{s.p}</p>
        </section>
      ))}
      <p className={styles.updated}>
        {COPY.brand.name}. Versión provisional — se sustituirá por el texto definitivo tras la
        revisión jurídica.
      </p>
    </main>
  );
}
