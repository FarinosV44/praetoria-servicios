/**
 * Renders one or more JSON-LD structured-data blocks (issue #18).
 *
 * `type="application/ld+json"` is a data block, not executable script, so it is
 * not affected by the `script-src` CSP (next.config.ts). One `<script>` per node
 * keeps each block independently valid.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const nodes = Array.isArray(data) ? data : [data];
  return (
    <>
      {nodes.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  );
}
