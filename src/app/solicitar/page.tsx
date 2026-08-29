import type { Metadata } from "next";
import { Assistant } from "./Assistant";

export const metadata: Metadata = {
  title: "Cuéntanos qué ocurre",
  description:
    "Explica tu problema del hogar con fotos y tus palabras. Lo analizamos y te damos presupuesto y plazo en menos de 24 horas.",
};

export default async function SolicitarPage({
  searchParams,
}: {
  searchParams: Promise<{ seguro?: string }>;
}) {
  const sp = await searchParams;
  return (
    <main id="contenido">
      <Assistant startInsurance={sp.seguro === "1"} />
    </main>
  );
}
