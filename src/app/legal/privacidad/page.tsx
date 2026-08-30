import type { Metadata } from "next";
import { COPY } from "@/config/copy";
import { LegalDoc } from "../LegalDoc";

export const metadata: Metadata = {
  title: COPY.legal.privacy.title,
  description: "Política de privacidad provisional de Praetoria Servicios.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/legal/privacidad" },
};

export default function PrivacidadPage() {
  return <LegalDoc doc={COPY.legal.privacy} />;
}
