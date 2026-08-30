import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { bodySchema, type Block } from "@/domain/content/blocks";
import { toSlug } from "@/domain/content/slug";
import styles from "./content.module.css";

/**
 * Renders a validated block body (issue #24). Server component, semantic HTML,
 * no `dangerouslySetInnerHTML` — inline formatting is parsed into React nodes,
 * so there is no HTML-injection surface. The same component renders the admin
 * preview and the public page, so "preview idéntica al resultado" holds by
 * construction.
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

function renderInline(text: string): ReactNode {
  const parts = text.split(INLINE).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*")) return <em key={i}>{p.slice(1, -1)}</em>;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(p);
    if (link) {
      const href = link[2];
      const internal = href.startsWith("/");
      return internal ? (
        <Link key={i} href={href}>
          {link[1]}
        </Link>
      ) : (
        <a key={i} href={href} rel="noreferrer nofollow" target="_blank">
          {link[1]}
        </a>
      );
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      return block.level === 2 ? (
        <h2 id={toSlug(block.text)}>{block.text}</h2>
      ) : (
        <h3 id={toSlug(block.text)}>{block.text}</h3>
      );
    case "text":
      return <p>{renderInline(block.md)}</p>;
    case "list":
      return block.ordered ? (
        <ol>
          {block.items.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </ol>
      ) : (
        <ul>
          {block.items.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote className={styles.quote}>
          <p>{renderInline(block.text)}</p>
          {block.cite && <cite>{block.cite}</cite>}
        </blockquote>
      );
    case "cta":
      return (
        <p className={styles.cta}>
          <Link href={block.href} className={styles.ctaLink}>
            {block.label}
          </Link>
        </p>
      );
    case "table":
      return (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((c, i) => (
                    <td key={i}>{renderInline(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "image":
      return (
        <figure className={styles.figure}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt={block.alt} loading="lazy" />
          {(block.caption || block.credit) && (
            <figcaption>
              {block.caption}
              {block.credit ? ` — ${block.credit}` : ""}
            </figcaption>
          )}
        </figure>
      );
    case "notice":
      return (
        <aside
          className={block.tone === "warning" ? styles.noticeWarn : styles.noticeInfo}
          role="note"
        >
          {renderInline(block.text)}
        </aside>
      );
    case "faq":
      return (
        <div className={styles.faq}>
          {block.items.map((it, i) => (
            <details key={i}>
              <summary>{it.q}</summary>
              <p>{renderInline(it.a)}</p>
            </details>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function BlockRenderer({ body }: { body: unknown }) {
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return null;
  return (
    <div className={styles.prose}>
      {parsed.data.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}
