import type { MetadataRoute } from "next";
import { COPY } from "@/config/copy";

/**
 * Web app manifest (issue #18). Colours come from the design tokens
 * (`src/ui/tokens.css`): brand `#c05f3c`, page background `#faf7f2`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${COPY.brand.name} — ${COPY.brand.tagline}`,
    short_name: COPY.brand.name,
    description:
      "Explica tu problema del hogar con fotos y palabras normales. Lo analizamos y te damos " +
      "presupuesto y plazo en menos de 24 horas laborables.",
    start_url: "/",
    display: "standalone",
    lang: "es-ES",
    background_color: "#faf7f2",
    theme_color: "#c05f3c",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
