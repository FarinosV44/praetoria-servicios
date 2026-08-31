import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/ui";
import { COPY } from "@/config/copy";
import { PROBLEMS } from "@/config/problems";
import { findTrade } from "@/config/trades";
import { breadcrumbLd } from "@/lib/seo";
import styles from "../servicios/servicios.module.css";

export const metadata: Metadata = {
  title: "Problemas del hogar más habituales",
  description:
    "Fugas de agua, grifos que gotean, enchufes que chispean, persianas rotas, cerraduras atascadas… " +
    "Qué suele causarlos, qué puedes hacer con seguridad y cuándo necesitas un profesional.",
  alternates: { canonical: "/problemas" },
  openGraph: {
    title: `Problemas del hogar habituales · ${COPY.brand.name}`,
    description:
      "Explicaciones claras de los problemas domésticos más frecuentes y qué profesional los resuelve.",
    type: "website",
    locale: "es_ES",
  },
};

const URGENCY_LABEL: Record<string, string> = {
  ALTA: "Atención prioritaria",
  MEDIA: "No conviene esperar",
  BAJA: "Se puede planificar",
};

export default function ProblemasIndexPage() {
  const byTrade = new Map<string, typeof PROBLEMS>();
  for (const p of PROBLEMS) {
    const list = byTrade.get(p.trade) ?? [];
    list.push(p);
    byTrade.set(p.trade, list);
  }

  return (
    <main id="contenido" className={styles.page}>
      <JsonLd
        data={breadcrumbLd([
          { name: "Inicio", path: "/" },
          { name: "Problemas", path: "/problemas" },
        ])}
      />
      <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link> / Problemas
      </nav>

      <h1 className={styles.title}>Problemas del hogar más habituales</h1>
      <p className={styles.intro}>
        No necesitas saber a qué profesional llamar. Busca lo que te está pasando: te explicamos las
        causas más probables, qué puedes hacer con seguridad mientras tanto y quién lo resuelve.
      </p>

      {[...byTrade.entries()].map(([tradeKey, list]) => {
        const trade = findTrade(tradeKey);
        return (
          <section key={tradeKey} className={styles.section} aria-labelledby={`t-${tradeKey}`}>
            <h2 id={`t-${tradeKey}`} className={styles.h2}>
              {trade?.label ?? tradeKey}
            </h2>
            <ul className={styles.index}>
              {list.map((p) => (
                <li key={p.slug}>
                  <Link href={`/problemas/${p.slug}`} className={styles.indexCard}>
                    <h3>{p.title}</h3>
                    <p>
                      {p.intro.length > 140 ? `${p.intro.slice(0, 137)}…` : p.intro}
                    </p>
                    <p>
                      <small>{URGENCY_LABEL[p.urgency]}</small>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className={styles.disclaimer}>{COPY.landing.footer.note}</p>
    </main>
  );
}
