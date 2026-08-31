import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { COPY } from "@/config/copy";
import { EntryTracker } from "@/ui/EntryTracker";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Every route is dynamically rendered so the per-request CSP nonce (issue #29,
 * generated in `src/proxy.ts`) is injected into Next's inline hydration scripts.
 * A statically prerendered page bakes its inline scripts at build time with no
 * nonce, and the strict CSP then blocks them — hydration never runs.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: `${COPY.brand.name} — ${COPY.brand.tagline}`,
    template: `%s · ${COPY.brand.name}`,
  },
  description:
    "Explica tu problema del hogar con fotos y palabras normales. Lo analizamos y te damos presupuesto y plazo en menos de 24 horas.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${nunito.variable}`}>
      <body>
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        <EntryTracker />
        {children}
      </body>
    </html>
  );
}
