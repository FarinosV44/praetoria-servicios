"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth";
import { contentService } from "@/server/services/content";
import { ARTICLE_STATUSES } from "@/domain/content/article-status";
import { err, ok, type Result } from "@/lib/result";
import type { ArticleKind } from "@prisma/client";

type A<T = null> = Promise<Result<T, { kind: string; message?: string }>>;

const KINDS: ArticleKind[] = [
  "GUIA",
  "ARTICULO",
  "FAQ",
  "SEGURIDAD",
  "SEGUROS",
  "CASO",
  "PROBLEMA",
  "OTRO",
];

export async function createArticleAction(input: unknown): A<{ id: string }> {
  const s = await requireSession();
  const parsed = z
    .object({ title: z.string().trim().min(3).max(200), kind: z.enum(KINDS).optional() })
    .safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await contentService.create(parsed.data, s.adminId);
  return r.ok ? ok({ id: r.value.id }) : err({ kind: "error" });
}

export async function updateArticleAction(id: string, patch: unknown): A {
  const s = await requireSession();
  if (typeof patch !== "object" || patch === null) return err({ kind: "validation" });
  // `body` arrives as a JSON string from the editor textarea
  const p = { ...(patch as Record<string, unknown>) };
  if (typeof p.body === "string") {
    try {
      p.body = JSON.parse(p.body);
    } catch {
      return err({ kind: "invalid_body", message: "El cuerpo no es JSON válido." });
    }
  }
  if (typeof p.targetKeywords === "string") {
    p.targetKeywords = p.targetKeywords
      .split(/[\n,]/)
      .map((k) => k.trim())
      .filter(Boolean);
  }
  const r = await contentService.update(id, p, s.adminId);
  if (r.ok) revalidatePath(`/admin/contenido/${id}`);
  return r.ok
    ? ok(null)
    : err({ kind: r.error.kind, message: "message" in r.error ? (r.error as { message?: string }).message : undefined });
}

export async function setArticleReviewedAction(
  id: string,
  value: boolean,
  reviewer: string | undefined,
): A {
  const s = await requireSession();
  const r = await contentService.setReviewedByHuman(id, value, reviewer, s.adminId);
  if (r.ok) revalidatePath(`/admin/contenido/${id}`);
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}

export async function setArticleStatusAction(id: string, input: unknown): A {
  const s = await requireSession();
  const parsed = z
    .object({ to: z.enum(ARTICLE_STATUSES), publishAt: z.string().optional() })
    .safeParse(input);
  if (!parsed.success) return err({ kind: "validation" });
  const r = await contentService.setStatus(id, parsed.data.to, {
    adminId: s.adminId,
    publishAt: parsed.data.publishAt ? new Date(parsed.data.publishAt) : null,
  });
  if (r.ok) {
    revalidatePath(`/admin/contenido/${id}`);
    revalidatePath("/guias");
  }
  return r.ok
    ? ok(null)
    : err({
        kind: r.error.kind,
        message: r.error.kind === "transition" ? (r.error as { error: string }).error : undefined,
      });
}

export async function restoreArticleRevisionAction(id: string, revisionId: string): A {
  const s = await requireSession();
  const r = await contentService.restoreRevision(id, revisionId, s.adminId);
  if (r.ok) revalidatePath(`/admin/contenido/${id}`);
  return r.ok ? ok(null) : err({ kind: r.error.kind });
}
