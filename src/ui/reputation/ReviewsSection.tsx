import { reviewService } from "@/server/services/reviews";
import { REPUTATION } from "@/config/reputation";
import { REVIEW_DIMENSIONS, computeAggregate } from "@/domain/reputation/aggregate";
import { TRADES } from "@/config/trades";
import { safe } from "@/lib/safe";
import { ReviewList } from "./ReviewList";
import styles from "./reviews.module.css";

const TRADE_LABELS = Object.fromEntries(TRADES.map((t) => [t.key, t.label]));

/**
 * Reviews for a service or zone page (issue #26). Renders NOTHING when there is
 * no real published review — no empty state, no "sé el primero", no invented
 * rating. `heading` names the surface; `trade` narrows to one service.
 */
export async function ReviewsSection({
  trade,
  heading = "Opiniones verificadas",
}: {
  trade?: string;
  heading?: string;
}) {
  // A failed query here just hides the section — it never 500s the host page.
  const [aggregate, reviews] = await Promise.all([
    safe(() => reviewService.aggregateFor({ trade }), computeAggregate([]), "reviews.aggregate"),
    safe(() => reviewService.listPublished({ trade, take: 20 }), [], "reviews.list"),
  ]);

  if (aggregate.count === 0 || reviews.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="opiniones-verificadas">
      <h2 id="opiniones-verificadas">{heading}</h2>

      <div className={styles.head}>
        {aggregate.average !== null && (
          <span className={styles.score}>
            {aggregate.average.toFixed(1)} <span aria-hidden="true">★</span>
          </span>
        )}
        <span className={styles.count}>
          {aggregate.count} {aggregate.count === 1 ? "opinión" : "opiniones"} de trabajos cerrados
        </span>
      </div>

      <ul className={styles.dims}>
        {REVIEW_DIMENSIONS.map((d) => {
          const v = aggregate.dimensionAverages[d];
          if (v === null) return null;
          return (
            <li key={d}>
              {REPUTATION.dimensionLabel[d]}: <strong>{v.toFixed(1)}</strong>
            </li>
          );
        })}
      </ul>

      <p className={styles.verified}>{REPUTATION.verifiedMeaning}</p>

      <ReviewList
        reviews={reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          authorDisplayName: r.authorDisplayName,
          publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
          praetoriaResponse: r.praetoriaResponse,
          trade: r.request.trade,
        }))}
        tradeLabels={TRADE_LABELS}
      />

      {REPUTATION.googleReviewUrl && (
        <p className={styles.gbp}>
          ¿Trabajamos contigo?{" "}
          <a href={REPUTATION.googleReviewUrl} target="_blank" rel="noopener noreferrer nofollow">
            Deja también tu reseña en Google
          </a>
          .
        </p>
      )}
    </section>
  );
}
