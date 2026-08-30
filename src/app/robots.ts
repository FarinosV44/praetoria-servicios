import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/**
 * robots.txt (issue #18). Public marketing surfaces are crawlable; the admin
 * panel, signed client links (`/s/…`) and the API are not — they carry no SEO
 * value and `/s/` tokens must never be indexed (issue #16 / #17).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/servicios/", "/cobertura", "/confianza", "/guias", "/solicitar"],
      disallow: ["/admin", "/s/", "/api/"],
    },
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl("/").replace(/\/$/, ""),
  };
}
