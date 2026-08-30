/**
 * Conversion analytics (issue #18).
 *
 * Two hard rules, both enforced here and covered by `analytics.test.ts`:
 *  1. Events NEVER carry PII. No phone, email, name, address, free-text problem
 *     description, photo URL, postcode — nothing that identifies a person or a
 *     home. `sanitizeProps` is an allowlist: only a fixed set of low-cardinality
 *     dimensions survive, and each is shape-checked.
 *  2. Nothing fires without the ANALYTICS consent (never pre-checked — issue #10 / #18).
 *
 * The AC "funnel queryable by device and category" is met by every event carrying
 * `device` (mobile/tablet/desktop) and, where relevant, `category` (a trade key).
 *
 * Sink: a dev/console sink plus a seam for a real provider (Plausible / GA-style)
 * behind `NEXT_PUBLIC_ANALYTICS_URL` — a bare `navigator.sendBeacon`, no third-party
 * script, no cookies.
 */

export const ANALYTICS_EVENTS = [
  "landing_cta_click",
  "category_selected",
  "photos_started",
  "photos_completed",
  "analysis_started",
  "analysis_completed",
  "analysis_failed",
  "validation_shown",
  "validation_corrected",
  "request_submitted",
  "insurance_started",
  "insurance_completed",
  "quote_viewed",
  "quote_accepted",
  "quote_rejected",
  "link_opened",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export type DeviceClass = "mobile" | "tablet" | "desktop";

export interface AnalyticsProps {
  /** viewport class — one of three buckets, never a raw width */
  device?: DeviceClass;
  /** a trade key (`fontaneria`, …) or `no-se` */
  category?: string;
  /** an assistant step key */
  step?: string;
  /** a short enum-like reason, never free text */
  reason?: string;
  /** small non-negative counter (e.g. re-analysis count) */
  count?: number;
  /** milliseconds, clamped */
  durationMs?: number;
  /** entry point / origin marker */
  source?: string;
}

const DEVICES: readonly DeviceClass[] = ["mobile", "tablet", "desktop"];
/** allowlisted string dimensions and their shape: a short slug, nothing else */
const SLUG_KEYS = ["category", "step", "reason", "source"] as const;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9_-]{0,38}[a-z0-9])?$/;
const NUMBER_KEYS = ["count", "durationMs"] as const;
const MAX_DURATION_MS = 1000 * 60 * 30;

type SanitizedProps = Partial<Record<string, string | number>>;

/**
 * Reduce arbitrary input to the allowlisted, shape-checked dimensions.
 * Anything not explicitly allowed — or allowed but malformed — is dropped.
 */
export function sanitizeProps(raw: unknown): SanitizedProps {
  const out: SanitizedProps = {};
  if (!raw || typeof raw !== "object") return out;
  const src = raw as Record<string, unknown>;

  if (typeof src.device === "string" && (DEVICES as readonly string[]).includes(src.device)) {
    out.device = src.device;
  }

  for (const key of SLUG_KEYS) {
    const v = src[key];
    if (typeof v === "string" && SLUG_RE.test(v)) out[key] = v;
  }

  for (const key of NUMBER_KEYS) {
    const v = src[key];
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) continue;
    if (key === "durationMs" && v > MAX_DURATION_MS) continue;
    out[key] = key === "count" ? Math.floor(v) : v;
  }

  return out;
}

// ── Consent gate ────────────────────────────────────────────────────────────

const CONSENT_KEY = "praetoria.analytics-consent";
let consentGranted = false;

function readStoredConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}
consentGranted = readStoredConsent();

/** Called when the user grants/denies the ANALYTICS consent in the assistant. */
export function setAnalyticsConsent(granted: boolean): void {
  consentGranted = granted;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_KEY, granted ? "1" : "0");
  } catch {
    /* storage unavailable — in-memory flag still applies for this session */
  }
}

export function isAnalyticsAllowed(): boolean {
  return consentGranted;
}

// ── Sink ────────────────────────────────────────────────────────────────────

export interface TrackResult {
  sent: boolean;
  event?: AnalyticsEvent;
  props?: SanitizedProps;
}

function dispatch(event: AnalyticsEvent, props: SanitizedProps): void {
  const payload = { event, props, ts: Date.now() };

  if (typeof window !== "undefined") {
    const url = process.env.NEXT_PUBLIC_ANALYTICS_URL;
    if (url && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      try {
        navigator.sendBeacon(url, JSON.stringify(payload));
        return;
      } catch {
        /* fall through to console */
      }
    }
    if (process.env.NODE_ENV !== "production") {
      console.debug("[analytics]", event, props);
    }
    return;
  }

  // server-side occurrences (e.g. link_opened resolved in a route)
  if (process.env.NODE_ENV !== "test") {
    console.log(JSON.stringify({ t: new Date().toISOString(), kind: "analytics", ...payload }));
  }
}

/**
 * Record a conversion event. No-op (returns `{ sent: false }`) when consent is
 * absent or the event name is not in the fixed list.
 */
export function track(event: AnalyticsEvent, props?: AnalyticsProps): TrackResult {
  if (!consentGranted) return { sent: false };
  if (!(ANALYTICS_EVENTS as readonly string[]).includes(event)) return { sent: false };
  const clean = sanitizeProps(props);
  dispatch(event, clean);
  return { sent: true, event, props: clean };
}

/** Client-only: bucket the current viewport into a device class. */
export function deviceClass(): DeviceClass {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}
