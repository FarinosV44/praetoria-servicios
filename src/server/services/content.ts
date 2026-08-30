import "server-only";
import type { Prisma, ArticleKind, Article } from "@prisma/client";
import { db } from "@/lib/db";
import { log } from "@/lib/logging";
import { err, ok, type Result } from "@/lib/result";
import { toSlug, isValidSlug } from "@/domain/content/slug";
import {
  validateArticleTransition,
  type ArticleStatus,
} from "@/domain/content/article-status";
import { bodySchema } from "@/domain/content/blocks";
import { articleWarnings } from "@/domain/content/quality";

/**
 * Editorial CMS service (issue #24). An admin drives the whole content lifecycle
 * from the panel; nothing here needs a deploy.
 *
 * Hard gates: a valid unique slug, a validated block body, no PUBLICADO /
 * PROGRAMADO without `reviewedByHuman`, and a 301 redirect whenever a published
 * article's slug changes.
 */

export type ContentError =
  | { kind: "not_found" }
  | { kind: "invalid_slug" }
  | { kind: "slug_taken" }
  | { kind: "invalid_body" }
  | { kind: "transition"; error: string };

const SNAPSHOT_FIELDS = [
  "slug",
  "title",
  "excerpt",
  "body",
  "kind",
  "status",
  "author",
  "expertReviewer",
  "reviewedByHuman",
  "coverImageSrc",
  "coverImageAlt",
  "coverCaption",
  "coverCredit",
  "metaTitle",
  "metaDescription",
  "canonicalUrl",
  "noindex",
  "socialImage",
  "targetKeywords",
  "sources",
  "internalNotes",
  "publishAt",
  "nextReviewAt",
] as const;

function snapshotOf(a: Article): Prisma.InputJsonValue {
  const out: Record<string, unknown> = {};
  for (const f of SNAPSHOT_FIELDS) {
    const v = (a as Record<string, unknown>)[f];
    out[f] = v instanceof Date ? v.toISOString() : v;
  }
  return out as Prisma.InputJsonValue;
}

async function snapshot(articleId: string, adminId: string, note: string) {
  const a = await db.article.findUnique({ where: { id: articleId } });
  if (!a) return;
  await db.articleRevision.create({
    data: { articleId, editedByAdminId: adminId, snapshot: snapshotOf(a), note },
  });
}

export const contentService = {
  async create(
    input: { title: string; kind?: ArticleKind },
    adminId: string,
  ): Promise<Result<{ id: string; slug: string }, ContentError>> {
    let slug = toSlug(input.title) || `articulo-${Date.now()}`;
    if (await db.article.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }
    const row = await db.article.create({
      data: { title: input.title.trim(), slug, kind: input.kind ?? "ARTICULO", body: [] },
      select: { id: true, slug: true },
    });
    await snapshot(row.id, adminId, "Creado");
    log.info("article created", { slug: row.slug });
    return ok(row);
  },

  async update(
    id: string,
    patch: Record<string, unknown>,
    adminId: string,
  ): Promise<Result<null, ContentError>> {
    const current = await db.article.findUnique({ where: { id } });
    if (!current) return err({ kind: "not_found" });

    const data: Prisma.ArticleUpdateInput = {};

    if (typeof patch.slug === "string") {
      const s = patch.slug.trim();
      if (!isValidSlug(s)) return err({ kind: "invalid_slug" });
      if (s !== current.slug) {
        const clash = await db.article.findFirst({
          where: { slug: s, NOT: { id } },
          select: { id: true },
        });
        if (clash) return err({ kind: "slug_taken" });
        data.slug = s;
        // 301 redirect if the article has ever been public
        if (current.status === "PUBLICADO" || current.publishedAt) {
          await db.slugRedirect.upsert({
            where: { fromSlug: current.slug },
            create: { fromSlug: current.slug, toSlug: s },
            update: { toSlug: s },
          });
          // if the new slug had a redirect pointing away, drop it
          await db.slugRedirect.deleteMany({ where: { fromSlug: s } });
        }
      }
    }

    if (patch.body !== undefined) {
      const parsed = bodySchema.safeParse(patch.body);
      if (!parsed.success) return err({ kind: "invalid_body" });
      data.body = parsed.data as Prisma.InputJsonValue;
    }

    for (const f of [
      "title",
      "excerpt",
      "author",
      "expertReviewer",
      "coverImageSrc",
      "coverImageAlt",
      "coverCaption",
      "coverCredit",
      "metaTitle",
      "metaDescription",
      "canonicalUrl",
      "socialImage",
      "sources",
      "internalNotes",
    ] as const) {
      if (typeof patch[f] === "string") (data as Record<string, unknown>)[f] = (patch[f] as string).trim() || null;
    }
    if (typeof patch.noindex === "boolean") data.noindex = patch.noindex;
    if (typeof patch.kind === "string") data.kind = patch.kind as ArticleKind;
    if (Array.isArray(patch.targetKeywords)) {
      data.targetKeywords = (patch.targetKeywords as string[]).map((k) => k.trim()).filter(Boolean).slice(0, 20);
    }
    if (patch.nextReviewAt !== undefined) {
      data.nextReviewAt = patch.nextReviewAt ? new Date(patch.nextReviewAt as string) : null;
    }

    await snapshot(id, adminId, "Editado");
    await db.article.update({ where: { id }, data });
    return ok(null);
  },

  async setReviewedByHuman(
    id: string,
    value: boolean,
    reviewer: string | undefined,
    adminId: string,
  ): Promise<Result<null, ContentError>> {
    const a = await db.article.findUnique({ where: { id }, select: { id: true } });
    if (!a) return err({ kind: "not_found" });
    await snapshot(id, adminId, value ? "Marcado como revisado por humano" : "Revisión humana retirada");
    await db.article.update({
      where: { id },
      data: { reviewedByHuman: value, expertReviewer: reviewer?.trim() || undefined },
    });
    return ok(null);
  },

  async setStatus(
    id: string,
    to: ArticleStatus,
    opts: { publishAt?: Date | null; adminId: string },
  ): Promise<Result<null, ContentError>> {
    const a = await db.article.findUnique({ where: { id } });
    if (!a) return err({ kind: "not_found" });

    const check = validateArticleTransition({
      from: a.status,
      to,
      reviewedByHuman: a.reviewedByHuman,
      publishAt: opts.publishAt ?? a.publishAt,
    });
    if (!check.ok) return err({ kind: "transition", error: check.error });

    const data: Prisma.ArticleUpdateInput = { status: to };
    if (to === "PUBLICADO") {
      data.publishedAt = a.publishedAt ?? new Date();
      data.publishAt = null;
    } else if (to === "PROGRAMADO") {
      data.publishAt = opts.publishAt ?? a.publishAt;
    }

    await snapshot(id, opts.adminId, `Estado → ${to}`);
    await db.article.update({ where: { id }, data });
    log.info("article status", { slug: a.slug, from: a.status, to });
    return ok(null);
  },

  async restoreRevision(
    id: string,
    revisionId: string,
    adminId: string,
  ): Promise<Result<null, ContentError>> {
    const rev = await db.articleRevision.findFirst({
      where: { id: revisionId, articleId: id },
    });
    if (!rev) return err({ kind: "not_found" });
    const snap = rev.snapshot as Record<string, unknown>;

    await snapshot(id, adminId, `Restaurado desde una versión anterior`);
    await db.article.update({
      where: { id },
      data: {
        title: String(snap.title ?? ""),
        excerpt: (snap.excerpt as string) ?? null,
        body: (snap.body ?? []) as Prisma.InputJsonValue,
        kind: (snap.kind as ArticleKind) ?? "ARTICULO",
        author: (snap.author as string) ?? null,
        expertReviewer: (snap.expertReviewer as string) ?? null,
        coverImageSrc: (snap.coverImageSrc as string) ?? null,
        coverImageAlt: (snap.coverImageAlt as string) ?? null,
        coverCaption: (snap.coverCaption as string) ?? null,
        coverCredit: (snap.coverCredit as string) ?? null,
        metaTitle: (snap.metaTitle as string) ?? null,
        metaDescription: (snap.metaDescription as string) ?? null,
        canonicalUrl: (snap.canonicalUrl as string) ?? null,
        noindex: Boolean(snap.noindex),
        socialImage: (snap.socialImage as string) ?? null,
        targetKeywords: (snap.targetKeywords as string[]) ?? [],
        sources: (snap.sources as string) ?? null,
        internalNotes: (snap.internalNotes as string) ?? null,
      },
    });
    return ok(null);
  },

  /** Cron: publish scheduled articles whose time has come (issue #24). */
  async publishDue(now: Date = new Date()): Promise<number> {
    const due = await db.article.findMany({
      where: { status: "PROGRAMADO", publishAt: { lte: now } },
      select: { id: true },
    });
    for (const a of due) {
      await db.article.update({
        where: { id: a.id },
        data: { status: "PUBLICADO", publishedAt: now, publishAt: null },
      });
    }
    if (due.length) log.info("scheduled articles published", { count: due.length });
    return due.length;
  },

  async warningsFor(id: string) {
    const a = await db.article.findUnique({ where: { id } });
    if (!a) return [];
    const others = await db.article.findMany({
      where: { NOT: { id } },
      select: { title: true, slug: true },
    });
    return articleWarnings({
      article: {
        title: a.title,
        slug: a.slug,
        author: a.author ?? "",
        metaDescription: a.metaDescription,
        body: a.body,
      },
      otherTitles: others.map((o) => o.title),
      otherSlugs: others.map((o) => o.slug),
    });
  },

  async listForAdmin(status?: ArticleStatus) {
    return db.article.findMany({
      where: { status },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        kind: true,
        status: true,
        reviewedByHuman: true,
        publishAt: true,
        publishedAt: true,
        updatedAt: true,
      },
    });
  },

  async getForAdmin(id: string) {
    return db.article.findUnique({
      where: { id },
      include: { revisions: { orderBy: { createdAt: "desc" }, take: 30 } },
    });
  },

  // ── Public ────────────────────────────────────────────────────────────────

  async listPublished() {
    return db.article.findMany({
      where: { status: "PUBLICADO" },
      orderBy: { publishedAt: "desc" },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        kind: true,
        publishedAt: true,
        updatedAt: true,
        coverImageSrc: true,
        coverImageAlt: true,
      },
    });
  },

  /** Returns the article, or a redirect target, or nothing. */
  async resolvePublic(slug: string): Promise<
    { kind: "article"; article: Article } | { kind: "redirect"; to: string } | { kind: "none" }
  > {
    const article = await db.article.findFirst({ where: { slug, status: "PUBLICADO" } });
    if (article) return { kind: "article", article };
    const redirect = await db.slugRedirect.findUnique({ where: { fromSlug: slug } });
    if (redirect) return { kind: "redirect", to: redirect.toSlug };
    return { kind: "none" };
  },

  async publishedSlugs() {
    const rows = await db.article.findMany({
      where: { status: "PUBLICADO", noindex: false },
      select: { slug: true, updatedAt: true },
    });
    return rows;
  },
};
