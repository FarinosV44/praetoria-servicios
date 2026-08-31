import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd, TrackedCta } from "@/ui";
import { COPY } from "@/config/copy";
import { findTrade } from "@/config/trades";
import { SERVICE_TRADES } from "@/config/service-content";
import { localPageService, faqOf } from "@/server/services/localPage";
import { breadcrumbLd, faqPageLd, localAreaServiceLd } from "@/lib/seo";
import styles from "../../servicios/servicios.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ municipio: string }>;
}): Promise<Metadata> {
  const { municipio } = await params;
  const found = await localPageService.getPublic(municipio);
  if (!found) return {};
  const { page, indexable } = found;
  const description =
    page.metaDescription ?? page.intro ?? `Servicios para el hogar en ${page.municipality}.`;
  return {
    title: page.metaTitle ?? `Servicios para el hogar en ${page.municipality}`,
    description,
    alternates: { canonical: `/zonas/${page.slug}` },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title: page.metaTitle ?? `Servicios en ${page.municipality} · ${COPY.brand.name}`,
      description,
      type: "website",
      locale: "es_ES",
    },
  };
}

export default async function ZonaPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const { municipio } = await params;
  const found = await localPageService.getPublic(municipio);
  if (!found) notFound();
  const { page, indexable } = found;

  const trade = page.serviceKey ? findTrade(page.serviceKey) : undefined;
  const hasServicePage = page.serviceKey
    ? SERVICE_TRADES.some((t) => t.key === page.serviceKey)
    : false;
  const faq = faqOf(page);
  const services = page.typicalServices
    .map((k) => findTrade(k))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  const description =
    page.metaDescription ?? page.intro ?? `Servicios para el hogar en ${page.municipality}.`;

  return (
    <main id="contenido" className={styles.page}>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Inicio", path: "/" },
            { name: "Zonas", path: "/zonas" },
            { name: page.municipality, path: `/zonas/${page.slug}` },
          ]),
          ...(indexable
            ? [
                localAreaServiceLd({
                  municipality: page.municipality,
                  slug: page.slug,
                  serviceLabel: trade?.label ?? null,
                  description,
                }),
              ]
            : []),
          ...(indexable && faq.length ? [faqPageLd(faq)] : []),
        ]}
      />

      <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link> / <Link href="/zonas">Zonas</Link> / {page.municipality}
      </nav>

      <h1 className={styles.title}>
        {trade ? `${trade.label} en ${page.municipality}` : `Servicios para el hogar en ${page.municipality}`}
      </h1>
      {page.intro && <p className={styles.intro}>{page.intro}</p>}

      <section className={styles.section} aria-labelledby="cobertura">
        <h2 id="cobertura" className={styles.h2}>
          Cobertura en {page.municipality}
        </h2>
        <p>{page.coverageNote}</p>
        {page.responseTimeNote && <p>{page.responseTimeNote}</p>}
      </section>

      {services.length > 0 && (
        <section className={styles.section} aria-labelledby="servicios-zona">
          <h2 id="servicios-zona" className={styles.h2}>
            Lo que más nos piden aquí
          </h2>
          <ul className={styles.list}>
            {services.map((s) => (
              <li key={s.key}>
                {SERVICE_TRADES.some((t) => t.key === s.key) ? (
                  <Link href={`/servicios/${s.key}`}>{s.label}</Link>
                ) : (
                  s.label
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {page.completedJobsNote && (
        <section className={styles.section} aria-labelledby="trabajos">
          <h2 id="trabajos" className={styles.h2}>
            Trabajos realizados
          </h2>
          <p>{page.completedJobsNote}</p>
          {page.casePhotoNote && <p>{page.casePhotoNote}</p>}
        </section>
      )}

      {faq.length > 0 && (
        <section className={styles.section} aria-labelledby="faq">
          <h2 id="faq" className={styles.h2}>
            Preguntas frecuentes en {page.municipality}
          </h2>
          <dl>
            {faq.map((f) => (
              <div key={f.q}>
                <dt>
                  <strong>{f.q}</strong>
                </dt>
                <dd>{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {trade && hasServicePage && (
        <p>
          Más sobre el servicio de{" "}
          <Link href={`/servicios/${page.serviceKey}`}>{trade.label.toLowerCase()}</Link>.
        </p>
      )}

      <div className={styles.cta}>
        <TrackedCta href="/solicitar" source="zona" category={page.serviceKey ?? undefined}>
          {COPY.assistant.startCta}
        </TrackedCta>
      </div>

      <p className={styles.disclaimer}>{COPY.disclaimers.aiOrientative}</p>
    </main>
  );
}
