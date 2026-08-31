import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd, TrackedCta } from "@/ui";
import { COPY } from "@/config/copy";
import { PROBLEM_SLUGS, problemBySlug } from "@/config/problems";
import { findTrade } from "@/config/trades";
import { SERVICE_TRADES } from "@/config/service-content";
import { breadcrumbLd } from "@/lib/seo";
import styles from "../../servicios/servicios.module.css";

export function generateStaticParams() {
  return PROBLEM_SLUGS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

const URGENCY_LABEL: Record<string, string> = {
  ALTA: "Atención prioritaria — no sigas usando la instalación afectada",
  MEDIA: "No conviene dejarlo pasar",
  BAJA: "Se puede planificar sin urgencia",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = problemBySlug(slug);
  if (!p) return {};
  return {
    title: `${p.title}: causas y solución`,
    description: p.intro,
    alternates: { canonical: `/problemas/${slug}` },
    openGraph: {
      title: `${p.title} · ${COPY.brand.name}`,
      description: p.intro,
      type: "article",
      locale: "es_ES",
    },
  };
}

export default async function ProblemaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = problemBySlug(slug);
  if (!p) notFound();

  const trade = findTrade(p.trade);
  const hasServicePage = SERVICE_TRADES.some((t) => t.key === p.trade);
  const related = (p.relatedProblems ?? [])
    .map((s) => problemBySlug(s))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <main id="contenido" className={styles.page}>
      <JsonLd
        data={breadcrumbLd([
          { name: "Inicio", path: "/" },
          { name: "Problemas", path: "/problemas" },
          { name: p.title, path: `/problemas/${slug}` },
        ])}
      />

      <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link> / <Link href="/problemas">Problemas</Link> / {p.title}
      </nav>

      <h1 className={styles.title}>{p.title}</h1>
      <p className={styles.intro}>{p.intro}</p>

      <section className={styles.section} aria-labelledby="sintomas">
        <h2 id="sintomas" className={styles.h2}>
          Cómo se manifiesta
        </h2>
        <ul className={styles.list}>
          {p.symptoms.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="causas">
        <h2 id="causas" className={styles.h2}>
          Causas más probables
        </h2>
        <ul className={styles.list}>
          {p.causes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="seguridad">
        <h2 id="seguridad" className={styles.h2}>
          Qué puedes hacer con seguridad
        </h2>
        <p className={styles.intro}>{URGENCY_LABEL[p.urgency]}.</p>
        <ol className={styles.steps}>
          {p.safetySteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="profesional">
        <h2 id="profesional" className={styles.h2}>
          Quién lo resuelve
        </h2>
        <p>{p.professionalNeeded}</p>
        {trade && hasServicePage && (
          <p>
            Más sobre el servicio de{" "}
            <Link href={`/servicios/${p.trade}`}>{trade.label.toLowerCase()}</Link>.
          </p>
        )}
      </section>

      {p.insuranceAngle && (
        <section className={styles.insurance} aria-labelledby="seguro">
          <h2 id="seguro">¿Podría cubrirlo tu seguro de hogar?</h2>
          <p>{p.insuranceAngle}</p>
          <p>{COPY.disclaimers.insuranceNotGuaranteed}</p>
        </section>
      )}

      {related.length > 0 && (
        <section className={styles.section} aria-labelledby="relacionados">
          <h2 id="relacionados" className={styles.h2}>
            Problemas relacionados
          </h2>
          <ul className={styles.list}>
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/problemas/${r.slug}`}>{r.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.cta}>
        <TrackedCta href="/solicitar" source="problema" category={p.trade}>
          {COPY.assistant.startCta}
        </TrackedCta>
        {p.insuranceAngle && (
          <TrackedCta
            href="/solicitar?seguro=1"
            source="problema_seguro"
            category={p.trade}
            variant="secondary"
          >
            {COPY.assistant.insuranceCta}
          </TrackedCta>
        )}
      </div>

      <p className={styles.disclaimer}>{COPY.disclaimers.aiOrientative}</p>
    </main>
  );
}
