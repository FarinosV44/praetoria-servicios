"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth";
import { localPageService } from "@/server/services/localPage";
import { err, ok, type Result } from "@/lib/result";

type A<T = null> = Promise<Result<T, { kind: string; message?: string }>>;

const STATUSES = ["BORRADOR", "PUBLICADO", "ARCHIVADO"] as const;

export async function createLocalPageAction(input: unknown): A<{ id: string }> {
  const s = await requireSession();
  const parsed = z
    .object({ municipality: z.string().trim().min(2).max(120), slug: z.string().trim().optional() })
    .safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await localPageService.create(parsed.data, s.adminId);
  return r.ok ? ok({ id: r.value.id }) : err({ kind: r.error.kind });
}

export async function updateLocalPageAction(id: string, patch: unknown): A {
  const s = await requireSession();
  if (typeof patch !== "object" || patch === null) return err({ kind: "validation" });
  const p = { ...(patch as Record<string, unknown>) };

  if (typeof p.typicalServices === "string") {
    p.typicalServices = p.typicalServices
      .split(/[\n,]/)
      .map((k) => k.trim())
      .filter(Boolean);
  }
  if (typeof p.localFaq === "string") {
    const raw = p.localFaq.trim();
    if (raw === "") {
      p.localFaq = [];
    } else {
      try {
        p.localFaq = JSON.parse(raw);
      } catch {
        return err({ kind: "invalid_faq", message: "Las preguntas frecuentes no son JSON válido." });
      }
    }
  }

  const r = await localPageService.update(id, p, s.adminId);
  if (r.ok) revalidatePath(`/admin/zonas/${id}`);
  return r.ok ? ok(null) : err({ kind: r.error.kind, message: "message" in r.error ? (r.error as { message?: string }).message : undefined });
}

export async function setLocalPageStatusAction(id: string, input: unknown): A {
  const s = await requireSession();
  const parsed = z.object({ to: z.enum(STATUSES) }).safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await localPageService.setStatus(id, parsed.data.to, s.adminId);
  if (r.ok) {
    revalidatePath(`/admin/zonas/${id}`);
    revalidatePath("/zonas");
  }
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function setLocalPageNoindexAction(id: string, value: boolean): A {
  const s = await requireSession();
  const r = await localPageService.setNoindex(id, value, s.adminId);
  if (r.ok) {
    revalidatePath(`/admin/zonas/${id}`);
    revalidatePath("/zonas");
  }
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}
