import type { Metadata } from "next";
import { COPY } from "@/config/copy";
import { LegalDoc } from "../LegalDoc";

export const metadata: Metadata = {
  title: COPY.legal.notice.title,
  description: "Aviso legal provisional de Praetoria Servicios.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/legal/aviso-legal" },
};

export default function AvisoLegalPage() {
  return <LegalDoc doc={COPY.legal.notice} />;
}
