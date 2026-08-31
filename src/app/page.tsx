import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, Icon, JsonLd, TRADE_ICONS } from "@/ui";
import { COPY } from "@/config/copy";
import { TRADES } from "@/config/trades";
import { COVERED_MUNICIPALITIES } from "@/config/coverage";
import { faqPageLd, organizationLd, websiteLd } from "@/lib/seo";
import { TRUST_CHARTER } from "@/config/trust-charter";
import { reviewService } from "@/server/services/reviews";
import { findTrade } from "@/config/trades";
import { safe } from "@/lib/safe";
import styles from "./page.module.css";

const L = COPY.landing;

export const metadata: Metadata = {
  title: COPY.brand.tagline,
  description:
    "Explica tu problema del hogar con fotos y palabras normales. Un único responsable lo analiza, " +
    "elige al profesional y te da presupuesto y plazo en menos de 24 horas. Valencia y área metropolitana norte.",
  alternates: { canonical: "/" },
  openGraph: {
    title: `${COPY.brand.name} — ${COPY.brand.tagline}`,
    description:
      "Un servicio gestionado: entendemos el problema, seleccionamos la solución y te acompañamos " +
      "hasta que queda resuelto. Sin que te llamen cuatro profesionales.",
    type: "website",
    locale: "es_ES",
    siteName: COPY.brand.name,
  },
  twitter: { card: "summary_large_image", title: `${COPY.brand.name} — ${COPY.brand.tagline}` },
};

export default async function HomePage() {
  // The reviews block is optional — never let a DB blip 500 the landing page.
  const reviews = await safe(() => reviewService.listPublished(), [], "landing.reviews");
  return (
    <main id="contenido" className={styles.page}>
      <JsonLd data={[organizationLd(), websiteLd(), faqPageLd([...COPY.landing.faq.items])]} />
      {/* HERO — the service and a CTA within one mobile screen */}
      <section className={styles.hero}>
        <p className={styles.kicker}>{COPY.brand.name}</p>
        <h1 className={styles.title}>{COPY.brand.tagline}</h1>
        <p className={styles.lead}>{L.hero.lead}</p>
        <div className={styles.actions}>
          <ButtonLink href="/solicitar" size="lg">
            {COPY.assistant.startCta}
          </ButtonLink>
          <ButtonLink href="/solicitar?seguro=1" size="lg" variant="secondary">
            {COPY.assistant.insuranceCta}
          </ButtonLink>
        </div>
        <p className={styles.disclaimer}>{COPY.disclaimers.responseTime}</p>
      </section>

      {/* HOW IT WORKS */}
      <section className={styles.section} aria-labelledby="como-funciona">
        <h2 id="como-funciona" className={styles.h2}>
          {L.steps.heading}
        </h2>
        <ol className={styles.steps}>
          {L.steps.items.map((s, i) => (
            <li key={s.title} className={styles.step}>
              <span className={styles.stepNum} aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h3 className={styles.h3}>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* SERVICE CATEGORIES */}
      <section className={styles.section} aria-labelledby="categorias">
        <h2 id="categorias" className={styles.h2}>
          {L.categories.heading}
        </h2>
        <ul className={styles.categories}>
          {TRADES.map((t) => (
            <li key={t.key} className={styles.category}>
              <Icon name={TRADE_ICONS[t.key] ?? "info"} size={22} />
              <span className={styles.categoryLabel}>{t.label}</span>
              <span className={styles.categoryHint}>{t.hint}</span>
            </li>
          ))}
        </ul>
        <p className={styles.note}>{L.categories.note}</p>
        <p className={styles.note}>
          <Link href="/servicios">Ver cada servicio en detalle</Link>
        </p>
      </section>

      {/* NO NEED TO KNOW WHICH PROFESSIONAL */}
      <section className={styles.callout} aria-labelledby="no-hace-falta">
        <h2 id="no-hace-falta" className={styles.h2}>
          {L.noNeedToKnow.heading}
        </h2>
        <p>{L.noNeedToKnow.body}</p>
        <ButtonLink href="/solicitar" size="md">
          {COPY.assistant.startCta}
        </ButtonLink>
      </section>

      {/* ADVANTAGES */}
      <section className={styles.section} aria-labelledby="distinto">
        <h2 id="distinto" className={styles.h2}>
          {L.advantages.heading}
        </h2>
        <div className={styles.cards}>
          {L.advantages.items.map((a) => (
            <Card key={a.title}>
              <h3 className={styles.h3}>{a.title}</h3>
              <p>{a.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CONTRAST — traditional web vs marketplace vs Praetoria (D9) */}
      <section className={styles.section} aria-labelledby="diferencia">
        <h2 id="diferencia" className={styles.h2}>
          {L.contrast.heading}
        </h2>
        <p className={styles.message}>{L.contrast.message}</p>
        {/* tabIndex so keyboard users can scroll the table on narrow viewports (a11y, #19) */}
        <div className={styles.tableWrap} tabIndex={0} role="group" aria-label={L.contrast.heading}>
          <table className={styles.contrastTable}>
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col">Web tradicional</th>
                <th scope="col">Marketplace</th>
                <th scope="col">Praetoria</th>
              </tr>
            </thead>
            <tbody>
              {L.contrast.rows.map((r) => (
                <tr key={r.topic}>
                  <th scope="row">{r.topic}</th>
                  <td>{r.traditional}</td>
                  <td>{r.marketplace}</td>
                  <td className={styles.praetoriaCell}>{r.praetoria}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* TRUST — Carta de Confianza summary (#21) */}
      <section className={styles.callout} aria-labelledby="confianza">
        <h2 id="confianza" className={styles.h2}>
          {L.trust.heading}
        </h2>
        <p className={styles.note}>
          <span className={styles.managedSeal}>✓ Gestionado por Praetoria</span> — describe cómo
          trabajamos, no es un sello externo.
        </p>
        <ul className={styles.checkList}>
          {TRUST_CHARTER.summary.map((t) => (
            <li key={t}>
              <Icon name="ok" size={18} />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          {L.trust.note}{" "}
          <Link href="/confianza">Leer la Carta de Confianza completa</Link> (versión{" "}
          {TRUST_CHARTER.version}).
        </p>
      </section>

      {/* REVIEWS — only real, authorised, consented (issue #23). Hidden entirely when there are none. */}
      {reviews.length > 0 && (
        <section className={styles.section} aria-labelledby="opiniones">
          <h2 id="opiniones" className={styles.h2}>
            Opiniones de clientes
          </h2>
          <p className={styles.note}>
            Solo mostramos opiniones de trabajos realmente realizados y cerrados, con la autorización
            del cliente.
          </p>
          <ul className={styles.checkList}>
            {reviews.map((r) => (
              <li key={r.id}>
                <Icon name="ok" size={18} />
                <span>
                  <strong>{"★".repeat(r.rating)}</strong>{" "}
                  {r.comment ? `«${r.comment}» ` : ""}
                  <em>
                    — {r.authorDisplayName ?? "Cliente"}
                    {r.request.trade ? `, ${findTrade(r.request.trade)?.label ?? r.request.trade}` : ""}
                  </em>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* DATA PROTECTION */}
      <section className={styles.section} aria-labelledby="datos">
        <h2 id="datos" className={styles.h2}>
          {L.dataProtection.heading}
        </h2>
        <p>{L.dataProtection.body}</p>
        <p className={styles.note}>
          <a href="/legal/privacidad">{L.footer.legalPrivacy}</a>
        </p>
      </section>

      {/* VISUAL QUOTE EXAMPLE (D9) */}
      <section className={styles.section} aria-labelledby="ejemplo-presupuesto">
        <h2 id="ejemplo-presupuesto" className={styles.h2}>
          {L.quoteExample.heading}
        </h2>
        <div className={styles.quoteCard}>
          <p className={styles.quoteWork}>{L.quoteExample.workTitle}</p>
          <table className={styles.quoteLines}>
            <tbody>
              {L.quoteExample.lines.map((line) => (
                <tr key={line.concept}>
                  <td>{line.concept}</td>
                  <td>{line.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.quoteTotal}>{L.quoteExample.total}</p>
          <ul className={styles.quoteFacts}>
            {L.quoteExample.facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className={styles.note}>{L.quoteExample.caption}</p>
        </div>
      </section>

      {/* INSURANCE */}
      <section className={styles.callout} aria-labelledby="seguro">
        <h2 id="seguro" className={styles.h2}>
          {L.insuranceBlock.heading}
        </h2>
        <p>{L.insuranceBlock.body}</p>
        <ButtonLink href="/solicitar?seguro=1" size="md" variant="secondary">
          {COPY.assistant.insuranceCta}
        </ButtonLink>
      </section>

      {/* COVERAGE */}
      <section className={styles.section} aria-labelledby="cobertura">
        <h2 id="cobertura" className={styles.h2}>
          {L.coverage.heading}
        </h2>
        <p>{L.coverage.body}</p>
        <p className={styles.muniList}>{COVERED_MUNICIPALITIES.join(" · ")}</p>
        <p className={styles.note}>
          <Link href="/cobertura">Ver todos los municipios y comprobar tu zona</Link>
        </p>
      </section>

      {/* FAQ */}
      <section className={styles.section} aria-labelledby="faq">
        <h2 id="faq" className={styles.h2}>
          {L.faq.heading}
        </h2>
        <div className={styles.faq}>
          {L.faq.items.map((item) => (
            <details key={item.q} className={styles.faqItem}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* URGENCY — differentiated CTA, no 24/7 promise */}
      <section className={styles.urgency} aria-labelledby="urgencia">
        <h2 id="urgencia" className={styles.h2}>
          {L.urgency.heading}
        </h2>
        <p>{L.urgency.body}</p>
        <ButtonLink href="/solicitar" size="lg">
          {COPY.assistant.startCta}
        </ButtonLink>
      </section>

      <footer className={styles.footer}>
        <p className={styles.footerBrand}>{COPY.brand.name}</p>
        <p>{L.footer.note}</p>
        <nav className={styles.footerLinks} aria-label="Enlaces del sitio">
          <Link href="/servicios">Servicios</Link>
          <Link href="/problemas">Problemas</Link>
          <Link href="/zonas">Zonas</Link>
          <Link href="/cobertura">Cobertura</Link>
          <Link href="/confianza">Carta de Confianza</Link>
          <Link href="/trabaja-con-nosotros">Trabaja con nosotros</Link>
          <a href="/legal/privacidad">{L.footer.legalPrivacy}</a>
          <a href="/legal/aviso-legal">{L.footer.legalNotice}</a>
        </nav>
      </footer>
    </main>
  );
}
