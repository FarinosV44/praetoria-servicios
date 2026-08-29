import type { Metadata } from "next";
import { ButtonLink, Card } from "@/ui";
import { COPY } from "@/config/copy";
import { COVERED_MUNICIPALITIES } from "@/config/coverage";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: COPY.brand.tagline,
};

/**
 * Temporary landing. The conversion-oriented landing is issue #4; this page
 * exists so the app runs end to end and the CTAs point at the right places.
 */
export default function HomePage() {
  return (
    <main id="contenido" className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>{COPY.brand.name}</p>
        <h1 className={styles.title}>{COPY.brand.tagline}</h1>
        <p className={styles.lead}>
          Adjunta fotos y explica qué ocurre con tus palabras. Lo interpretamos, te proponemos una
          solución orientativa y te decimos qué profesional necesitas. Praetoria responde en menos
          de 24 horas laborables con presupuesto y plazo.
        </p>
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

      <section className={styles.grid} aria-label="Cómo funciona">
        <Card>
          <h2 className={styles.cardTitle}>1 · Cuéntanoslo</h2>
          <p>Fotos del problema y una descripción breve. No necesitas saber a quién llamar.</p>
        </Card>
        <Card>
          <h2 className={styles.cardTitle}>2 · Lo analizamos</h2>
          <p>
            Una primera lectura orientativa del caso y el oficio adecuado. La confirmas o la
            corriges.
          </p>
        </Card>
        <Card>
          <h2 className={styles.cardTitle}>3 · Te respondemos</h2>
          <p>Un presupuesto claro con lo incluido, lo excluido, impuestos, total y plazo.</p>
        </Card>
      </section>

      <section className={styles.coverage} aria-label="Cobertura">
        <h2 className={styles.cardTitle}>Dónde trabajamos</h2>
        <p>Valencia ciudad y municipios del norte del área metropolitana:</p>
        <p className={styles.muniList}>{COVERED_MUNICIPALITIES.join(" · ")}</p>
      </section>

      <footer className={styles.footer}>
        <p>
          {COPY.brand.name}. Servicio en pruebas. El análisis con IA es orientativo y no sustituye
          la valoración de un profesional.
        </p>
      </footer>
    </main>
  );
}
