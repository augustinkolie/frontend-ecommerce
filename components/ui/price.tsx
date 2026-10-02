import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";

/** Prix en chiffres tabulaires ; prix soldé en terracotta + prix barré. */
export function Price({
  amount,
  compareAt,
  currency = "GNF",
  size = "base",
  className,
}: {
  amount: number;
  compareAt?: number | null;
  currency?: string;
  size?: "sm" | "base" | "lg" | "xl";
  className?: string;
}) {
  const onSale = compareAt != null && compareAt > amount;
  const sizeClass = { sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl" }[size];

  return (
    <p className={cn("flex items-baseline gap-2 tabular-nums", sizeClass, className)}>
      <span className={cn("font-medium", onSale ? "text-accent" : "text-ink")}>
        {onSale && <span className="sr-only">Prix soldé : </span>}
        {formatPrice(amount, currency)}
      </span>
      {onSale && (
        <s className="text-sm text-ink-muted">
          <span className="sr-only">Prix d&apos;origine : </span>
          {formatPrice(compareAt, currency)}
        </s>
      )}
    </p>
  );
}
