import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { quoteService } from "@/server/services/quotes";
import { formatEuros } from "@/lib/money";
import { QuoteEditor } from "./QuoteEditor";
import styles from "../../../../admin.module.css";

export default async function QuotePage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const request = await db.request.findUnique({
    where: { reference: ref },
    select: { id: true, status: true },
  });
  if (!request) notFound();

  const quotes = await quoteService.listForRequest(ref);
  const draft = quotes.find((q) => q.status === "BORRADOR");
  const sent = quotes.filter((q) => q.status !== "BORRADOR");

  return (
    <div className={styles.detail}>
      <Link href={`/admin/solicitudes/${ref}`} className={styles.back}>
        ← Volver a la solicitud
      </Link>
      <h1>Presupuesto · {ref}</h1>

      {sent.length > 0 && (
        <section className={styles.card}>
          <h2>Versiones</h2>
          <ul>
            {sent.map((q) => (
              <li key={q.id}>
                v{q.version} · {q.status} · {formatEuros(q.totalCents as never)}
                {q.sentAt ? ` · enviado ${new Intl.DateTimeFormat("es-ES").format(q.sentAt)}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      <QuoteEditor reference={ref} initial={draft ?? null} />
    </div>
  );
}
