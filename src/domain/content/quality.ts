import { imagesOf } from "./blocks";

/**
 * Editorial quality warnings (issue #24 "Calidad"). Advisory — surfaced in the
 * editor; the hard gates (human review, no duplicate published slug) live in the
 * status machine and the service.
 */

export interface ArticleForQuality {
  title: string;
  slug: string;
  author: string;
  metaDescription?: string | null;
  body: unknown;
}

const norm = (s: string) => s.trim().toLowerCase();

export function articleWarnings(input: {
  article: ArticleForQuality;
  otherTitles: string[];
  otherSlugs: string[];
}): string[] {
  const { article, otherTitles, otherSlugs } = input;
  const w: string[] = [];

  if (otherTitles.map(norm).includes(norm(article.title))) {
    w.push("Título duplicado: ya existe otro contenido con el mismo título.");
  }
  if (otherSlugs.map(norm).includes(norm(article.slug))) {
    w.push("Slug duplicado: ya existe otro contenido con el mismo slug.");
  }
  if (!article.author.trim()) {
    w.push("Falta el autor.");
  }
  if (!article.metaDescription?.trim()) {
    w.push("Falta la meta description para SEO.");
  }
  const imgs = imagesOf(article.body);
  if (imgs.some((i) => !i.alt.trim())) {
    w.push("Hay imágenes sin texto alternativo (alt).");
  }
  if (article.title.trim().length < 8) {
    w.push("El título es muy corto.");
  }

  return w;
}
