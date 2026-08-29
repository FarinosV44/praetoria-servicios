import { cn } from "../cn";

/**
 * Consistent icon set (issue #3). Inline SVG (no external load → no layout
 * shift), 24×24 viewBox, `currentColor`, stroke-based. One visual language for
 * trades and states.
 */

export type IconName =
  // trades
  | "fontaneria"
  | "electricidad"
  | "electrodomesticos"
  | "montaje"
  | "carpinteria"
  | "pintura"
  | "jardineria"
  | "limpieza"
  | "mudanzas"
  | "climatizacion"
  | "cerrajeria"
  | "no-se"
  // states / meaning
  | "problema"
  | "analisis"
  | "solucion"
  | "seguro"
  | "foto"
  | "aviso"
  | "ok"
  | "info";

const PATHS: Record<IconName, React.ReactNode> = {
  fontaneria: (
    <>
      <path d="M7 3v6a5 5 0 0 0 10 0V3" />
      <path d="M12 14v7" />
      <path d="M9 21h6" />
    </>
  ),
  electricidad: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  electrodomesticos: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="13" r="4" />
      <path d="M7 6h.01M10 6h.01" />
    </>
  ),
  montaje: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V8h14v13" />
      <path d="M5 12h14" />
    </>
  ),
  carpinteria: (
    <>
      <path d="M3 7h18v4H3z" />
      <path d="M6 11v10M18 11v10" />
      <path d="M9 3l3 4 3-4" />
    </>
  ),
  pintura: (
    <>
      <rect x="4" y="3" width="12" height="7" rx="1" />
      <path d="M16 6h3a1 1 0 0 1 1 1v3a2 2 0 0 1-2 2h-6" />
      <path d="M12 13v3a2 2 0 0 1-2 2H9v3" />
    </>
  ),
  jardineria: (
    <>
      <path d="M12 22V11" />
      <path d="M12 11c0-4 3-7 8-7 0 4-3 7-8 7Z" />
      <path d="M12 14c0-3-3-5-8-5 0 4 4 5 8 5Z" />
    </>
  ),
  limpieza: (
    <>
      <path d="M19 3l-7 7" />
      <path d="M9 12l-4 9h11l1-7-8-2Z" />
    </>
  ),
  mudanzas: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="1" />
      <path d="M3 12h18" />
      <path d="M9 8V4h6v4" />
    </>
  ),
  climatizacion: (
    <>
      <rect x="3" y="5" width="18" height="8" rx="2" />
      <path d="M7 17c0 2 2 2 2 4M12 17c0 2 2 2 2 4M17 17c0 2-2 2-2 4" />
    </>
  ),
  cerrajeria: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15" r="1.5" />
    </>
  ),
  "no-se": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 4" />
      <path d="M12 17h.01" />
    </>
  ),
  problema: (
    <>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  analisis: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  solucion: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  seguro: (
    <>
      <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  foto: (
    <>
      <path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  aviso: (
    <>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 9v5M12 17h.01" />
    </>
  ),
  ok: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
};

export function Icon({
  name,
  size = 24,
  className,
  title,
}: {
  name: IconName;
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      className={cn("pra-icon", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}

export const TRADE_ICONS: Record<string, IconName> = {
  fontaneria: "fontaneria",
  electricidad: "electricidad",
  electrodomesticos: "electrodomesticos",
  montaje: "montaje",
  carpinteria: "carpinteria",
  pintura: "pintura",
  jardineria: "jardineria",
  limpieza: "limpieza",
  mudanzas: "mudanzas",
  climatizacion: "climatizacion",
  cerrajeria: "cerrajeria",
  "no-se": "no-se",
};
