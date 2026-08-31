import "server-only";
import type { LocalPage, LocalPageStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { log } from "@/lib/logging";
import { err, ok, type Result } from "@/lib/result";
import { isValidSlug, toSlug } from "@/domain/content/slug";
import { checkCoverage } from "@/config/coverage";
import { isKnownTrade } from "@/config/trades";
import {
  isLocalPageIndexable,
  type LocalPageForEligibility,
} from "@/domain/local-seo/local-page";

/**
 * Local SEO service (issue #25). An admin drives `/zonas/[municipio]` pages from
 * the panel — no deploy. A page exists only once created here, and is indexed
 * only when `isLocalPageIndexable` passes (D10).
 */

export type LocalPageError =
  | { kind: "not_found" }
  | { kind: "invalid_slug" }
  | { kind: "slug_taken" }
  | { kind: "invalid_service" }
  | { kind: "invalid_faq" };

export interface LocalFaqEntry {
  q: string;
  a: string;
}

function parseFaq(raw: unknown): LocalFaqEntry[] | null {
  if (!Array.isArray(raw)) return null;
  const out: LocalFaqEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const q = (item as Record<string, unknown>).q;
    const a = (item as Record<string, unknown>).a;
    if (typeof q !== "string" || typeof a !== "string") return null;
    const qt = q.trim();
    const at = a.trim();
    if (qt && at) out.push({ q: qt, a: at });
  }
  return out;
}

export function faqOf(page: Pick<LocalPage, "localFaq">): LocalFaqEntry[] {
  return parseFaq(page.localFaq) ?? [];
}

/** The eligibility view of a stored row + whether its municipality is covered. */
export function eligibilityOf(page: LocalPage): {
  indexable: boolean;
  reasons: string[];
} {
  const covered = checkCoverage({ municipality: page.municipality }).matchedBy === "municipality";
  const view: LocalPageForEligibility = {
    status: page.status,
    noindex: page.noindex,
    coverageNote: page.coverageNote,
    typicalServices: page.typicalServices,
    responseTimeNote: page.responseTimeNote,
    localFaq: faqOf(page),
    completedJobsNote: page.completedJobsNote,
    casePhotoNote: page.casePhotoNote,
  };
  return isLocalPageIndexable(view, { coveredMunicipality: covered });
}

const STRING_FIELDS = [
  "municipality",
  "intro",
  "coverageNote",
  "responseTimeNote",
  "completedJobsNote",
  "casePhotoNote",
  "metaTitle",
  "metaDescription",
] as const;

export const localPageService = {
  async create(
    input: { municipality: string; slug?: string },
    adminId: string,
  ): Promise<Result<{ id: string; slug: string }, LocalPageError>> {
    const municipality = input.municipality.trim();
    let slug = (input.slug?.trim() || toSlug(municipality)) || `zona-${Date.now()}`;
    if (!isValidSlug(slug)) return err({ kind: "invalid_slug" });
    if (await db.localPage.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }
    const row = await db.localPage.create({
      data: { slug, municipality },
      select: { id: true, slug: true },
    });
    log.info("local page created", { slug: row.slug, adminId });
    return ok(row);
  },

  async update(
    id: string,
    patch: Record<string, unknown>,
    adminId: string,
  ): Promise<Result<null, LocalPageError>> {
    const current = await db.localPage.findUnique({ where: { id } });
    if (!current) return err({ kind: "not_found" });

    const data: Prisma.LocalPageUpdateInput = {};

    if (typeof patch.slug === "string") {
      const s = patch.slug.trim();
      if (!isValidSlug(s)) return err({ kind: "invalid_slug" });
      if (s !== current.slug) {
        const clash = await db.localPage.findFirst({
          where: { slug: s, NOT: { id } },
          select: { id: true },
        });
        if (clash) return err({ kind: "slug_taken" });
        data.slug = s;
      }
    }

    if (patch.serviceKey !== undefined) {
      if (patch.serviceKey === null || patch.serviceKey === "") {
        data.serviceKey = null;
      } else if (typeof patch.serviceKey === "string" && isKnownTrade(patch.serviceKey)) {
        data.serviceKey = patch.serviceKey;
      } else {
        return err({ kind: "invalid_service" });
      }
    }

    if (patch.typicalServices !== undefined) {
      const list = Array.isArray(patch.typicalServices) ? (patch.typicalServices as unknown[]) : [];
      const keys = list.map((k) => String(k).trim()).filter(Boolean);
      if (keys.some((k) => !isKnownTrade(k))) return err({ kind: "invalid_service" });
      data.typicalServices = Array.from(new Set(keys));
    }

    if (patch.localFaq !== undefined) {
      const parsed = parseFaq(patch.localFaq);
      if (!parsed) return err({ kind: "invalid_faq" });
      data.localFaq = parsed as unknown as Prisma.InputJsonValue;
    }

    for (const f of STRING_FIELDS) {
      if (typeof patch[f] === "string") {
        const v = (patch[f] as string).trim();
        if (f === "municipality") {
          if (v) (data as Record<string, unknown>)[f] = v;
        } else if (f === "coverageNote") {
          data.coverageNote = v;
        } else {
          (data as Record<string, unknown>)[f] = v || null;
        }
      }
    }

    await db.localPage.update({ where: { id }, data });
    log.info("local page updated", { slug: current.slug, adminId });
    return ok(null);
  },

  async setStatus(
    id: string,
    to: LocalPageStatus,
    adminId: string,
  ): Promise<Result<null, LocalPageError>> {
    const page = await db.localPage.findUnique({ where: { id } });
    if (!page) return err({ kind: "not_found" });
    const data: Prisma.LocalPageUpdateInput = { status: to };
    if (to === "PUBLICADO") data.publishedAt = page.publishedAt ?? new Date();
    await db.localPage.update({ where: { id }, data });
    log.info("local page status", { slug: page.slug, from: page.status, to, adminId });
    return ok(null);
  },

  async setNoindex(
    id: string,
    value: boolean,
    adminId: string,
  ): Promise<Result<null, LocalPageError>> {
    const page = await db.localPage.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!page) return err({ kind: "not_found" });
    await db.localPage.update({ where: { id }, data: { noindex: value } });
    log.info("local page noindex", { slug: page.slug, value, adminId });
    return ok(null);
  },

  // ── Public ────────────────────────────────────────────────────────────────

  /** The page for a public `/zonas/[municipio]` route, or null when it 404s. */
  async getPublic(slug: string): Promise<
    { page: LocalPage; indexable: boolean } | null
  > {
    const page = await db.localPage.findFirst({ where: { slug, status: "PUBLICADO" } });
    if (!page) return null;
    return { page, indexable: eligibilityOf(page).indexable };
  },

  /** Sitemap: published pages that genuinely pass the D10 guard. */
  async listIndexable(): Promise<{ slug: string; municipality: string; updatedAt: Date }[]> {
    const rows = await db.localPage.findMany({ where: { status: "PUBLICADO" } });
    return rows
      .filter((p) => eligibilityOf(p).indexable)
      .map((p) => ({ slug: p.slug, municipality: p.municipality, updatedAt: p.updatedAt }));
  },

  /** Public index at `/zonas` — every published zone, indexable or not. */
  async listPublished(): Promise<{ slug: string; municipality: string; intro: string | null }[]> {
    const rows = await db.localPage.findMany({
      where: { status: "PUBLICADO" },
      orderBy: { municipality: "asc" },
      select: { slug: true, municipality: true, intro: true },
    });
    return rows;
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  async listForAdmin() {
    const rows = await db.localPage.findMany({
      orderBy: [{ status: "asc" }, { municipality: "asc" }],
    });
    return rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      municipality: p.municipality,
      status: p.status,
      noindex: p.noindex,
      updatedAt: p.updatedAt,
      indexable: eligibilityOf(p).indexable,
      reasons: eligibilityOf(p).reasons,
    }));
  },

  async getForAdmin(id: string) {
    const page = await db.localPage.findUnique({ where: { id } });
    if (!page) return null;
    return { page, eligibility: eligibilityOf(page), faq: faqOf(page) };
  },
};
