import type { ArticleKind } from "@prisma/client";

/** Editorial CMS configuration (issue #24). */

export const CONTENT = {
  /** Public URL prefix for editorial content. */
  basePath: "/guias",

  kindLabel: {
    GUIA: "Guía",
    ARTICULO: "Artículo",
    FAQ: "Preguntas frecuentes",
    SEGURIDAD: "Seguridad y mantenimiento",
    SEGUROS: "Seguros del hogar",
    CASO: "Caso real (anonimizado)",
    PROBLEMA: "Problema frecuente",
    OTRO: "Otro",
  } satisfies Record<ArticleKind, string>,

  /** Contextual CTA rendered under an article and by the `cta` block by default. */
  defaultCta: { label: "Explica tu problema y te damos presupuesto", href: "/solicitar" },
} as const;
