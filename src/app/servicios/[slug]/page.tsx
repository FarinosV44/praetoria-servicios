import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, JsonLd } from "@/ui";
import { COPY } from "@/config/copy";
import { findTrade } from "@/config/trades";
import { SERVICE_TRADES, serviceContentFor } from "@/config/service-content";
import { problemsForTrade } from "@/config/problems";
import { breadcrumbLd, serviceLd } from "@/lib/seo";
import styles from "../servicios.module.css";

export function generateStaticParams() {
  return SERVICE_TRADES.map((t) => ({ slug: t.key }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trade = findTrade(slug);
  if (!trade || !SERVICE_TRADES.some((t) => t.key === slug)) return {};
  const content = serviceContentFor(slug);
  const title = `${trade.label} en Valencia y área metropolitana norte`;
  return {
    title,
    description: content.intro,
    alternates: { canonical: `/servicios/${slug}` },
    openGraph: {
      title: `${title} · ${COPY.brand.name}`,
      description: content.intro,
      type: "website",
      locale: "es_ES",
    },
  };
}

export default async function ServicioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trade = findTrade(slug);
  if (!trade || !SERVICE_TRADES.some((t) => t.key === slug)) notFound();
  const content = serviceContentFor(slug);
  const problems = problemsForTrade(slug);

  return (
    <main id="contenido" className={styles.page}>
      <JsonLd
        data={[
          serviceLd(trade),
          breadcrumbLd([
            { name: "Inicio", path: "/" },
            { name: "Servicios", path: "/servicios" },
            { name: trade.label, path: `/servicios/${slug}` },
          ]),
        ]}
      />

      <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link> / <Link href="/servicios">Servicios</Link> / {trade.label}
      </nav>

      <h1 className={styles.title}>{trade.label} en Valencia</h1>
      <p className={styles.intro}>{content.intro}</p>

      <section className={styles.section} aria-labelledby="cubre">
        <h2 id="cubre" className={styles.h2}>
          Qué cubre este servicio
        </h2>
        <ul className={styles.list}>
          {content.covers.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="problemas">
        <h2 id="problemas" className={styles.h2}>
          Problemas habituales que nos cuentan
        </h2>
        <ul className={styles.quotes}>
          {content.typicalProblems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="presupuesto">
        <h2 id="presupuesto" className={styles.h2}>
          Qué incluye el presupuesto
        </h2>
        <ul className={styles.list}>
          {content.quoteIncludes.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="proceso">
        <h2 id="proceso" className={styles.h2}>
          Cómo funciona
        </h2>
        <ol className={styles.steps}>
          {content.howItWorks.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      {problems.length > 0 && (
        <section className={styles.section} aria-labelledby="problemas-guia">
          <h2 id="problemas-guia" className={styles.h2}>
            Problemas concretos que resolvemos
          </h2>
          <ul className={styles.list}>
            {problems.map((p) => (
              <li key={p.slug}>
                <Link href={`/problemas/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {content.insuranceAngle && (
        <section className={styles.insurance} aria-labelledby="seguro">
          <h2 id="seguro">¿Podría cubrirlo tu seguro de hogar?</h2>
          <p>{content.insuranceAngle}</p>
          <p>{COPY.disclaimers.insuranceNotGuaranteed}</p>
        </section>
      )}

      <div className={styles.cta}>
        <ButtonLink href="/solicitar" size="lg">
          {COPY.assistant.startCta}
        </ButtonLink>
        {content.insuranceAngle && (
          <ButtonLink href="/solicitar?seguro=1" size="lg" variant="secondary">
            {COPY.assistant.insuranceCta}
          </ButtonLink>
        )}
      </div>

      <p className={styles.disclaimer}>{COPY.disclaimers.aiOrientative}</p>
    </main>
  );
}
