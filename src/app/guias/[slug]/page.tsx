import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ButtonLink, JsonLd } from "@/ui";
import { BlockRenderer } from "@/ui/content/BlockRenderer";
import { COPY } from "@/config/copy";
import { CONTENT } from "@/config/content";
import { contentService } from "@/server/services/content";
import { headingsOf, faqItemsOf } from "@/domain/content/blocks";
import { articleLd, breadcrumbLd, faqPageLd } from "@/lib/seo";
import { safe } from "@/lib/safe";
import styles from "@/ui/content/content.module.css";

const fmt = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(d) : null;

async function load(slug: string) {
  const r = await safe(
    () => contentService.resolvePublic(slug),
    { kind: "none" as const },
    "guia.resolve",
  );
  if (r.kind === "redirect") permanentRedirect(`/guias/${r.to}`);
  if (r.kind === "none") return null;
  return r.article;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await load(slug);
  if (!a) return {};
  const description = a.metaDescription ?? a.excerpt ?? a.title;
  return {
    title: a.metaTitle ?? a.title,
    description,
    alternates: { canonical: a.canonicalUrl ?? `/guias/${a.slug}` },
    robots: a.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: a.metaTitle ?? a.title,
      description,
      type: "article",
      locale: "es_ES",
      images: a.socialImage ? [a.socialImage] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await load(slug);
  if (!a) notFound();

  const toc = headingsOf(a.body);
  const faqs = faqItemsOf(a.body);
  const description = a.metaDescription ?? a.excerpt ?? a.title;

  return (
    <main id="contenido" className={styles.page}>
      <JsonLd
        data={[
          articleLd({
            title: a.title,
            description,
            slug: a.slug,
            author: a.author,
            datePublished: a.publishedAt?.toISOString() ?? null,
            dateModified: a.updatedAt.toISOString(),
            image: a.coverImageSrc ?? a.socialImage ?? null,
          }),
          breadcrumbLd([
            { name: "Inicio", path: "/" },
            { name: "Guías", path: "/guias" },
            { name: a.title, path: `/guias/${a.slug}` },
          ]),
          ...(faqs.length ? [faqPageLd(faqs)] : []),
        ]}
      />

      <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link> / <Link href="/guias">Guías</Link> / {a.title}
      </nav>

      <span className={styles.kind}>{CONTENT.kindLabel[a.kind]}</span>
      <h1 className={styles.title}>{a.title}</h1>
      <p className={styles.meta}>
        {a.author ? `Por ${a.author}` : "Equipo Praetoria"}
        {a.expertReviewer ? ` · Revisado por ${a.expertReviewer}` : ""}
        {fmt(a.publishedAt) ? ` · Publicado el ${fmt(a.publishedAt)}` : ""}
        {a.publishedAt && a.updatedAt.getTime() - a.publishedAt.getTime() > 86_400_000
          ? ` · Actualizado el ${fmt(a.updatedAt)}`
          : ""}
      </p>

      {a.coverImageSrc && (
        <figure className={styles.figure}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.coverImageSrc} alt={a.coverImageAlt ?? ""} />
          {(a.coverCaption || a.coverCredit) && (
            <figcaption>
              {a.coverCaption}
              {a.coverCredit ? ` — ${a.coverCredit}` : ""}
            </figcaption>
          )}
        </figure>
      )}

      {a.excerpt && <p className={styles.meta}>{a.excerpt}</p>}

      {toc.length >= 3 && (
        <nav className={styles.toc} aria-label="Contenido de la guía">
          <strong>En esta guía</strong>
          <ul>
            {toc.map((h) => (
              <li key={h.id} style={{ marginLeft: h.level === 3 ? "1rem" : 0 }}>
                <a href={`#${h.id}`}>{h.text}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <BlockRenderer body={a.body} />

      <div className={styles.cta}>
        <ButtonLink href={CONTENT.defaultCta.href} size="lg">
          {CONTENT.defaultCta.label}
        </ButtonLink>
      </div>
      <p className={styles.meta}>{COPY.disclaimers.aiOrientative}</p>
    </main>
  );
}
