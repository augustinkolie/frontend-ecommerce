"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { defaultPageSize, pageItems } from "@/lib/pagination";

type Base = {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  pageSizes: readonly number[];
  density?: "shop" | "admin";
  /** Nom des éléments au pluriel : « produits », « commandes »… */
  noun?: string;
  className?: string;
};

type Props = Base & {
  onPageSizeChange: (size: number) => void;
} & ({ href: (page: number) => string; onPageChange?: never } | { onPageChange: (page: number) => void; href?: never });

/** Pagination numérotée + choix du nombre d'éléments par page. */
export function Pagination({ page, pageCount, total, pageSize, pageSizes, density = "shop", noun = "éléments", href, onPageChange, onPageSizeChange, className }: Props) {
  const shop = density === "shop";
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const cell = shop ? "h-11 min-w-11 px-3" : "h-8 min-w-8 px-2";
  const icon = shop ? 18 : 14;

  const item = (p: number, children: ReactNode, opts: { label: string; active?: boolean; off?: boolean }) => {
    const cls = cn(
      "inline-flex items-center justify-center rounded-sm border tabular-nums transition-colors duration-150",
      cell,
      opts.active ? "border-ink bg-ink text-on-ink" : "border-transparent text-ink hover:border-line hover:bg-surface-alt",
      opts.off && "pointer-events-none opacity-40",
    );
    if (opts.active || opts.off) {
      return (
        <span className={cls} aria-current={opts.active ? "page" : undefined} aria-disabled={opts.off || undefined} aria-label={opts.label}>
          {children}
        </span>
      );
    }
    return href ? (
      <Link href={href(p)} className={cls} aria-label={opts.label}>
        {children}
      </Link>
    ) : (
      <button type="button" className={cls} aria-label={opts.label} onClick={() => onPageChange?.(p)}>
        {children}
      </button>
    );
  };

  const selectId = `par-${noun.replace(/\W+/g, "-")}`;

  return (
    <div className={cn("flex flex-col items-center gap-4 md:flex-row md:justify-between", shop ? "text-sm" : "text-xs", className)}>
      <p className="text-ink-muted tabular-nums" aria-live="polite">
        {total === 0 ? `0 ${noun}` : `${from}–${to} sur ${total} ${noun}`}
      </p>

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="order-first md:order-none">
          <ul className="flex items-center gap-1">
            <li>{item(page - 1, <ChevronLeft aria-hidden size={icon} strokeWidth={1.5} />, { label: "Page précédente", off: page <= 1 })}</li>
            {pageItems(page, pageCount).map((p, i) =>
              p === "…" ? (
                <li key={`gap-${i}`} aria-hidden className={cn("inline-flex items-center justify-center text-ink-muted", cell)}>
                  …
                </li>
              ) : (
                // Sur mobile : première, courante et dernière page seulement.
                <li key={p} className={cn(p !== page && p !== 1 && p !== pageCount && "hidden sm:block")}>
                  {item(p, p, { label: `Page ${p}`, active: p === page })}
                </li>
              ),
            )}
            <li>{item(page + 1, <ChevronRight aria-hidden size={icon} strokeWidth={1.5} />, { label: "Page suivante", off: page >= pageCount })}</li>
          </ul>
        </nav>
      )}

      <div className="flex items-center gap-2 text-ink-muted">
        <label htmlFor={selectId}>Afficher</label>
        <Select id={selectId} density="admin" className={shop ? "w-24" : "h-8 w-20 pr-8 text-xs"} value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
          {pageSizes.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
        <span>par page</span>
      </div>
    </div>
  );
}

/**
 * Variante « liens » (boutique) : `?page=` et `?par=` dans l'URL.
 * Chaque page a sa propre adresse (partageable, indexable, bouton Retour fiable).
 */
export function LinkPagination(props: Omit<Base, "density">) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const hrefFor = (p: number, size = props.pageSize) => {
    const next = new URLSearchParams(params);
    if (p > 1) next.set("page", String(p));
    else next.delete("page");
    if (size !== defaultPageSize(props.pageSizes)) next.set("par", String(size));
    else next.delete("par");
    next.delete("cursor");
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return <Pagination {...props} density="shop" href={hrefFor} onPageSizeChange={(size) => router.push(hrefFor(1, size))} />;
}
