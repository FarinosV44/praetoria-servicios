"use client";

import type { ReactNode } from "react";
import { ButtonLink } from "@/ui";
import { deviceClass, track } from "@/lib/analytics";

/**
 * A CTA link that emits a `landing_cta_click` conversion event (issue #25,
 * AC-25-cta). `source` is a short slug identifying the template the click came
 * from (`problema`, `zona`, …); `category` is an optional trade key. Both are
 * allowlisted analytics dimensions — no PII ever leaves here.
 */
export function TrackedCta({
  href,
  source,
  category,
  variant,
  children,
}: {
  href: string;
  source: string;
  category?: string;
  variant?: "primary" | "secondary";
  children: ReactNode;
}) {
  return (
    <ButtonLink
      href={href}
      size="lg"
      variant={variant}
      onClick={() => track("landing_cta_click", { device: deviceClass(), source, category })}
    >
      {children}
    </ButtonLink>
  );
}
