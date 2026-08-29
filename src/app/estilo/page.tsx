import type { Metadata } from "next";
import { StyleCatalogue } from "./StyleCatalogue";

export const metadata: Metadata = {
  title: "Catálogo de estilo",
  robots: { index: false, follow: false },
};

/**
 * Internal design-system catalogue (issue #3). Not indexed. Speeds up building
 * screens by showing every primitive, state and token in one place.
 */
export default function EstiloPage() {
  return <StyleCatalogue />;
}
