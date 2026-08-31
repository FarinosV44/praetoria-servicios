import "server-only";
import { db } from "@/lib/db";
import { log } from "@/lib/logging";
import { err, ok, type Result } from "@/lib/result";
import { parseSeoCsv } from "@/domain/seo/metrics-csv";
import {
  intentCannibalization,
  lowCtrQueries,
  staleContent,
  strikingDistanceQueries,
  type ArticleForSeo,
} from "@/domain/seo/opportunities";
import { internalLinkingGaps } from "@/domain/seo/linking-gaps";
import { faqCandidatesFromRequests } from "@/domain/seo/faq-suggestions";
import { PROBLEMS } from "@/config/problems";
import { SERVICE_TRADES } from "@/config/service-content";
import { localPageService } from "./localPage";
import { contentService } from "./content";

/**
 * Local SEO control centre (issue #27). No Search Console / analytics API in this
 * MVP — metrics come in by CSV. Everything the panel shows is tagged with a
 * period, a source, and whether it is real data, an estimate, or a
 * recommendation. It never claims a change caused a ranking move.
 */

export type SeoError = { kind: "empty_csv" } | { kind: "not_found" };

function countInternalLinks(body: unknown): number {
  const s = JSON.stringify(body ?? "");
  const md = (s.match(/\]\(\\?"?\/[a-z]/gi) ?? []).length;
  const cta = (s.match(/"href":"\/[a-z]/gi) ?? []).length;
  return md + cta;
}

export const seoService = {
  async importCsv(
    text: string,
    meta: { source: string; periodStart: Date; periodEnd: Date; note?: string },
    adminId: string,
  ): Promise<Result<{ importId: string; rowCount: number; skipped: number; skippedReasons: string[] }, SeoError>> {
    const parsed = parseSeoCsv(text);
    if (parsed.rows.length === 0) return err({ kind: "empty_csv" });

    const imp = await db.seoMetricImport.create({
      data: {
        source: meta.source.trim() || "manual",
        periodStart: meta.periodStart,
        periodEnd: meta.periodEnd,
        note: meta.note?.trim() || null,
        rowCount: parsed.rows.length,
        skippedCount: parsed.skipped,
        createdByAdminId: adminId,
        rows: {
          create: parsed.rows.map((r) => ({
            query: r.query,
            page: r.page,
            clicks: Math.round(r.clicks),
            impressions: Math.round(r.impressions),
            ctr: r.ctr,
            position: r.position,
            device: r.device,
            municipality: r.municipality,
          })),
        },
      },
      select: { id: true },
    });
    log.info("seo metrics imported", { rows: parsed.rows.length, skipped: parsed.skipped, adminId });
    return ok({
      importId: imp.id,
      rowCount: parsed.rows.length,
      skipped: parsed.skipped,
      skippedReasons: parsed.skippedReasons,
    });
  },

  async listImports() {
    return db.seoMetricImport.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        source: true,
        periodStart: true,
        periodEnd: true,
        note: true,
        rowCount: true,
        skippedCount: true,
        createdAt: true,
      },
    });
  },

  async latestImportRows() {
    const latest = await db.seoMetricImport.findFirst({ orderBy: { createdAt: "desc" } });
    if (!latest) return { import: null, rows: [] as Awaited<ReturnType<typeof db.seoMetricRow.findMany>> };
    const rows = await db.seoMetricRow.findMany({ where: { importId: latest.id } });
    return { import: latest, rows };
  },

  /** Imported pages that have traffic but no attributed request (AC-27-funnel). */
  async pagesWithTrafficNoRequests() {
    const { import: imp, rows } = await this.latestImportRows();
    if (!imp) return { period: null, source: null, items: [] as { page: string; clicks: number; impressions: number }[] };

    const byPage = new Map<string, { clicks: number; impressions: number }>();
    for (const r of rows) {
      if (!r.page) continue;
      const g = byPage.get(r.page) ?? { clicks: 0, impressions: 0 };
      g.clicks += r.clicks;
      g.impressions += r.impressions;
      byPage.set(r.page, g);
    }

    const withReq = await db.request.groupBy({
      by: ["entryPath"],
      where: { entryPath: { in: [...byPage.keys()] }, submittedAt: { not: null } },
      _count: { _all: true },
    });
    const requestPages = new Set(withReq.map((w) => w.entryPath));

    const items = [...byPage.entries()]
      .filter(([page, g]) => g.clicks >= 5 && !requestPages.has(page))
      .sort((a, b) => b[1].clicks - a[1].clicks)
      .map(([page, g]) => ({ page, ...g }));

    return { period: { start: imp.periodStart, end: imp.periodEnd }, source: imp.source, items };
  },

  /** The whole dashboard payload. */
  async overview() {
    const now = new Date();
    const { import: imp, rows } = await this.latestImportRows();

    const articles = await db.article.findMany({
      select: { slug: true, title: true, targetKeywords: true, status: true, updatedAt: true, body: true },
    });
    const forSeo: ArticleForSeo[] = articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      targetKeywords: a.targetKeywords,
      status: a.status,
      updatedAt: a.updatedAt,
      internalLinkCount: countInternalLinks(a.body),
    }));

    const localPages = await localPageService.listForAdmin();
    const requests = await db.request.findMany({
      where: { submittedAt: { not: null }, problemText: { not: null } },
      select: { trade: true, problemText: true },
      take: 500,
    });

    const period = imp ? { start: imp.periodStart, end: imp.periodEnd } : null;
    const source = imp ? imp.source : null;

    return {
      metrics: {
        period,
        source,
        importedAt: imp?.createdAt ?? null,
        rowCount: rows.length,
      },
      // real data
      queries: rows
        .slice()
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 50)
        .map((r) => ({
          query: r.query,
          page: r.page,
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
          position: r.position,
          device: r.device,
        })),
      // recommendations
      lowCtr: lowCtrQueries(rows),
      strikingDistance: strikingDistanceQueries(rows),
      staleContent: staleContent(forSeo, now),
      cannibalization: intentCannibalization(forSeo),
      linkingGaps: internalLinkingGaps({
        problems: PROBLEMS.map((p) => ({ slug: p.slug, title: p.title, trade: p.trade })),
        serviceTradeKeys: SERVICE_TRADES.map((t) => t.key),
        localPages: localPages.map((z) => ({
          slug: z.slug,
          municipality: z.municipality,
          indexable: z.indexable,
          reasons: z.reasons,
          status: z.status,
        })),
        articles: forSeo.map((a) => ({
          slug: a.slug,
          title: a.title,
          internalLinkCount: a.internalLinkCount,
          status: a.status,
        })),
      }),
      faqCandidates: faqCandidatesFromRequests(requests),
    };
  },

  /** "Crear borrador desde una consulta" — never auto-published (issue #24 gate). */
  async draftFromQuery(query: string, adminId: string): Promise<Result<{ id: string }, SeoError>> {
    const title = query.trim().slice(0, 120);
    if (!title) return err({ kind: "not_found" });
    const r = await contentService.create({ title, kind: "ARTICULO" }, adminId);
    if (!r.ok) return err({ kind: "not_found" });
    await db.article.update({
      where: { id: r.value.id },
      data: { targetKeywords: [title], internalNotes: `Borrador creado desde una consulta SEO real: "${title}".` },
    });
    return ok({ id: r.value.id });
  },
};
