/**
 * CSV import for SEO metrics (issue #27) — the fallback path when no Search
 * Console / analytics API is configured. Pure: takes text, returns typed rows
 * plus a count of what was skipped and why.
 *
 * Hard rule (AC-27-nopii): a row whose `query` contains anything PII-shaped
 * (phone, email, address) is DROPPED, never stored.
 */

import { detectPii } from "@/domain/reputation/pii";

export interface SeoCsvRow {
  query: string;
  page: string | null;
  clicks: number;
  impressions: number;
  /** 0..1 */
  ctr: number;
  position: number;
  device: "mobile" | "tablet" | "desktop" | null;
  municipality: string | null;
}

export interface SeoCsvParseResult {
  rows: SeoCsvRow[];
  skipped: number;
  skippedReasons: string[];
}

const HEADER_ALIASES: Record<keyof SeoCsvRow, string[]> = {
  query: ["query", "consulta", "consultas", "búsqueda", "busqueda", "keyword", "palabra clave"],
  page: ["page", "página", "pagina", "url", "landing page"],
  clicks: ["clicks", "clics", "clic"],
  impressions: ["impressions", "impresiones", "impresión", "impresion"],
  ctr: ["ctr"],
  position: ["position", "posición", "posicion", "avg. pos", "posición media"],
  device: ["device", "dispositivo"],
  municipality: ["municipality", "municipio", "city", "ciudad", "location", "país/región", "region"],
};

const norm = (s: string) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^"|"$/g, "");

/** RFC-4180-ish single line split: respects double quotes and "" escapes. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQ = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQ = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function num(raw: string): number {
  const s = raw.replace(/\s/g, "").replace("%", "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function deviceOf(raw: string): SeoCsvRow["device"] {
  const d = norm(raw);
  if (d.startsWith("mob") || d.includes("móvil") || d.includes("movil")) return "mobile";
  if (d.startsWith("tab")) return "tablet";
  if (d.startsWith("desk") || d.includes("ordenador") || d.includes("escritorio")) return "desktop";
  return null;
}

export function parseSeoCsv(text: string): SeoCsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return { rows: [], skipped: 0, skippedReasons: [] };

  const header = splitCsvLine(lines[0]).map(norm);
  const idx = {} as Record<keyof SeoCsvRow, number>;
  (Object.keys(HEADER_ALIASES) as (keyof SeoCsvRow)[]).forEach((key) => {
    idx[key] = header.findIndex((h) => HEADER_ALIASES[key].some((a) => h === norm(a)));
  });
  if (idx.query < 0) return { rows: [], skipped: lines.length - 1, skippedReasons: ["no-query-column"] };

  const rows: SeoCsvRow[] = [];
  const reasons = new Set<string>();
  let skipped = 0;

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const query = (cells[idx.query] ?? "").trim();
    if (!query || cells.length < 2) {
      skipped++;
      reasons.add("malformed");
      continue;
    }
    if (detectPii(query).hasPii) {
      skipped++;
      reasons.add("pii");
      continue;
    }
    const clicks = idx.clicks >= 0 ? num(cells[idx.clicks]) : 0;
    const impressions = idx.impressions >= 0 ? num(cells[idx.impressions]) : 0;
    const ctrRaw = idx.ctr >= 0 ? (cells[idx.ctr] ?? "") : "";
    let ctr = idx.ctr >= 0 ? num(ctrRaw) : NaN;
    // A "%" sign means a percentage regardless of magnitude ("0.17%" → 0.0017);
    // a bare value > 1 is also a percentage ("53" → 0.53).
    if (Number.isFinite(ctr) && (ctrRaw.includes("%") || ctr > 1)) ctr = ctr / 100;
    if (!Number.isFinite(ctr)) ctr = impressions > 0 ? clicks / impressions : 0;
    const position = idx.position >= 0 ? num(cells[idx.position]) : NaN;

    if (![clicks, impressions].every(Number.isFinite)) {
      skipped++;
      reasons.add("bad-numbers");
      continue;
    }

    rows.push({
      query,
      page: idx.page >= 0 ? cells[idx.page]?.trim() || null : null,
      clicks,
      impressions,
      ctr: Math.max(0, Math.min(1, ctr)),
      position: Number.isFinite(position) ? position : 0,
      device: idx.device >= 0 ? deviceOf(cells[idx.device] ?? "") : null,
      municipality: idx.municipality >= 0 ? cells[idx.municipality]?.trim() || null : null,
    });
  }

  return { rows, skipped, skippedReasons: [...reasons] };
}
