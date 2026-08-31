"use client";

import { useMemo, useState } from "react";
import { REPUTATION } from "@/config/reputation";
import styles from "./reviews.module.css";

export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  authorDisplayName: string | null;
  publishedAt: string | null;
  praetoriaResponse: string | null;
  trade: string | null;
}

type Sort = "recent" | "rating_desc" | "rating_asc";

const fmtDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(iso)) : null;

const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

/**
 * Transparent client-side sort over the reviews already sent by the server
 * (issue #26 — "filtros y orden transparente"). No rating filter that hides
 * criticism: every published review is always in the list, only the order changes.
 */
export function ReviewList({
  reviews,
  tradeLabels,
}: {
  reviews: PublicReview[];
  tradeLabels: Record<string, string>;
}) {
  const [sort, setSort] = useState<Sort>("recent");

  const ordered = useMemo(() => {
    const copy = [...reviews];
    if (sort === "rating_desc") copy.sort((a, b) => b.rating - a.rating);
    else if (sort === "rating_asc") copy.sort((a, b) => a.rating - b.rating);
    else
      copy.sort(
        (a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
      );
    return copy;
  }, [reviews, sort]);

  return (
    <div>
      <div className={styles.controls}>
        <label htmlFor="review-sort">Ordenar por</label>
        <select
          id="review-sort"
          value={sort}
          onChange={(e) => setSort(e.currentTarget.value as Sort)}
        >
          {(Object.keys(REPUTATION.sortLabel) as Sort[]).map((s) => (
            <option key={s} value={s}>
              {REPUTATION.sortLabel[s]}
            </option>
          ))}
        </select>
      </div>

      <ul className={styles.list}>
        {ordered.map((r) => (
          <li key={r.id} className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.stars} aria-label={`${r.rating} de 5`}>
                {stars(r.rating)}
              </span>
              {r.authorDisplayName && <span>{r.authorDisplayName}</span>}
              {r.trade && tradeLabels[r.trade] && <span>· {tradeLabels[r.trade]}</span>}
              {fmtDate(r.publishedAt) && <span>· {fmtDate(r.publishedAt)}</span>}
            </div>
            {r.comment && <p className={styles.comment}>{r.comment}</p>}
            {r.praetoriaResponse && (
              <p className={styles.response}>
                <strong>Respuesta de Praetoria:</strong> {r.praetoriaResponse}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
