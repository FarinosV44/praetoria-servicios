"use client";

import { useEffect } from "react";

/**
 * First-touch entry attribution (issue #27). Writes a first-party cookie with
 * the LANDING PATH ONLY (no query string) and the REFERRER HOST ONLY — never a
 * full URL, never anything PII. Set once per browser and left alone; the server
 * copies it onto a `Request` when a draft is created, so we can tell which page
 * an organic visit entered on.
 */
const COOKIE = "praetoria_entry";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function EntryTracker() {
  useEffect(() => {
    try {
      if (document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE}=`))) return;
      const path = window.location.pathname.slice(0, 200);
      let refHost = "";
      if (document.referrer) {
        try {
          const u = new URL(document.referrer);
          if (u.host !== window.location.host) refHost = u.host.slice(0, 120);
        } catch {
          /* ignore */
        }
      }
      const value = encodeURIComponent(JSON.stringify({ p: path, r: refHost }));
      document.cookie = `${COOKIE}=${value}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
    } catch {
      /* cookies unavailable — attribution is best-effort */
    }
  }, []);

  return null;
}
