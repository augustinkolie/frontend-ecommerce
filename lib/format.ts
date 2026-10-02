/**
 * Les montants sont stockés en entiers, dans la plus petite unité de la devise
 * (centimes pour l'EUR, unité pour le GNF qui n'a pas de subdivision).
 */
const FRACTION_DIGITS: Record<string, number> = { EUR: 2, GNF: 0, XOF: 0 };

export function formatPrice(amount: number, currency = "GNF", locale = "fr-FR") {
  const digits = FRACTION_DIGITS[currency] ?? 2;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount / 10 ** digits);
}

export function discountPercent(price: number, compareAtPrice: number) {
  if (compareAtPrice <= price) return 0;
  return Math.round((1 - price / compareAtPrice) * 100);
}
