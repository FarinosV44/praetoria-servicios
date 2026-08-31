"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth";
import { seoService } from "@/server/services/seo";
import { err, ok, type Result } from "@/lib/result";

type A<T = null> = Promise<Result<T, { kind: string; message?: string }>>;

export async function importSeoCsvAction(input: unknown): A<{
  rowCount: number;
  skipped: number;
  skippedReasons: string[];
}> {
  const s = await requireSession();
  const parsed = z
    .object({
      csv: z.string().min(10).max(2_000_000),
      source: z.string().trim().max(60).default("gsc-csv"),
      periodStart: z.coerce.date(),
      periodEnd: z.coerce.date(),
      note: z.string().trim().max(500).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });

  const r = await seoService.importCsv(
    parsed.data.csv,
    {
      source: parsed.data.source,
      periodStart: parsed.data.periodStart,
      periodEnd: parsed.data.periodEnd,
      note: parsed.data.note,
    },
    s.adminId,
  );
  if (r.ok) revalidatePath("/admin/seo");
  return r.ok
    ? ok({ rowCount: r.value.rowCount, skipped: r.value.skipped, skippedReasons: r.value.skippedReasons })
    : err({ kind: r.error.kind });
}

export async function draftFromQueryAction(query: string): A<{ id: string }> {
  const s = await requireSession();
  const parsed = z.string().trim().min(3).max(120).safeParse(query);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await seoService.draftFromQuery(parsed.data, s.adminId);
  if (r.ok) revalidatePath("/admin/contenido");
  return r.ok ? ok({ id: r.value.id }) : err({ kind: r.error.kind });
}
