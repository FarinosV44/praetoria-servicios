/**
 * Money — integer minor units (EUR cents). No floating point anywhere in quote math.
 * Issue #12: "Los cálculos monetarios no usan coma flotante."
 */

export type Cents = number & { readonly __brand: "Cents" };

export function cents(n: number): Cents {
  if (!Number.isInteger(n)) {
    throw new Error(`Money must be an integer number of cents, received ${n}`);
  }
  return n as Cents;
}

/** Parse a user-entered euro string ("1.234,56" or "1234.56" or "1234,56") into Cents. */
export function parseEuros(input: string): Cents {
  const cleaned = input.trim().replace(/\s|€/g, "");
  // Normalise decimal separator: assume the last of ',' or '.' is the decimal mark.
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalised: string;
  if (lastComma > lastDot) {
    normalised = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    normalised = cleaned.replace(/,/g, "");
  }
  const value = Number(normalised);
  if (!Number.isFinite(value)) {
    throw new Error(`Cannot parse euro amount: "${input}"`);
  }
  return cents(Math.round(value * 100));
}

export function addCents(...values: Cents[]): Cents {
  return cents(values.reduce((sum, v) => sum + v, 0));
}

export function subtractCents(a: Cents, b: Cents): Cents {
  return cents(a - b);
}

export function multiplyCents(amount: Cents, factor: number): Cents {
  return cents(Math.round(amount * factor));
}

/**
 * Apply a tax rate given in basis points (e.g. 2100 = 21% IVA) and return the tax amount.
 * Basis points keep the rate itself an integer.
 */
export function taxAmount(base: Cents, rateBasisPoints: number): Cents {
  if (!Number.isInteger(rateBasisPoints) || rateBasisPoints < 0) {
    throw new Error(
      `Tax rate must be a non-negative integer in basis points, got ${rateBasisPoints}`,
    );
  }
  return cents(Math.round((base * rateBasisPoints) / 10000));
}

const eurFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export function formatEuros(amount: Cents): string {
  return eurFormatter.format(amount / 100);
}
