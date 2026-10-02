import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkPagination } from "@/components/ui/pagination";
import type { ProductList } from "@/lib/api/types";
import { readPageParams, SHOP_PAGE_SIZES } from "@/lib/pagination";
import { ActiveFilters, MobileFilters, SortSelect } from "./filters";
import { ProductGrid } from "./product-card";

export const LISTING_KEYS = ["size", "shoe_size", "dimension", "color", "material", "price_min", "price_max", "on_sale", "sort"];
/** Query string de l'API, limitée aux paramètres connus, avec la page demandée (`?page=`, `?par=`). */
export function listingQuery(searchParams: Record<string, string | string[] | undefined>, base: Record<string, string> = {}) {
  const qs = new URLSearchParams(base);
  for (const key of LISTING_KEYS) {
    const v = searchParams[key];
    const value = Array.isArray(v) ? v.join(",") : v;
    if (value) qs.set(key, value);
  }
  const { page, pageSize } = readPageParams(searchParams, SHOP_PAGE_SIZES);
  qs.set("page", String(page));
  qs.set("limit", String(pageSize));
  return qs;
}

/** Nombre de filtres actifs (pour la décision d'indexation). */
export function activeFilterCount(searchParams: Record<string, string | string[] | undefined>) {
  return LISTING_KEYS.filter((k) => k !== "sort" && searchParams[k]).reduce((n, k) => {
    const v = searchParams[k];
    return n + String(Array.isArray(v) ? v.join(",") : v).split(",").length;
  }, 0);
}

export function Listing({
  title,
  intro,
  breadcrumb,
  subnav,
  data,
  query,
  currency,
}: {
  title: string;
  intro?: string;
  breadcrumb?: ReactNode;
  subnav?: { name: string; href: string; active?: boolean }[];
  data: ProductList;
  query: URLSearchParams;
  currency: string;
}) {
  const total = data.total ?? data.items.length;
  const noFacets = data.facets.length === 0 && !query.has("price_min") && !query.has("price_max");

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 md:px-8">
      <div className="flex flex-col gap-4 pb-8">
        {breadcrumb}
        <h1 className="font-serif text-4xl font-normal tracking-title md:text-5xl">{title}</h1>
        {intro && <p className="max-w-prose text-ink-muted">{intro}</p>}
        {subnav && subnav.length > 0 && (
          <nav aria-label="Sous-catégories" className="-mx-4 overflow-x-auto px-4">
            <ul className="flex gap-2">
              {subnav.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    aria-current={s.active ? "page" : undefined}
                    className={`inline-flex h-11 items-center rounded-sm border px-4 text-sm whitespace-nowrap ${s.active ? "border-ink bg-ink text-on-ink" : "border-line bg-surface hover:border-ink"}`}
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
        <p className="text-sm text-ink-muted tabular-nums" aria-live="polite">
          {total} produit{total > 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          {!noFacets && <MobileFilters facets={data.facets} currency={currency} total={total} />}
          <SortSelect />
        </div>
      </div>
      <div className="mb-6">
        <ActiveFilters />
      </div>
      {data.items.length === 0 ? (
        <EmptyState title="Aucun produit ne correspond" description="Retirez un filtre ou élargissez la fourchette de prix." />
      ) : (
        <>
          <ProductGrid products={data.items} currency={currency} priorityCount={2} />
          <Suspense>
            <LinkPagination
              className="mt-16 border-t border-line pt-8"
              page={data.page}
              pageCount={data.pageCount}
              total={total}
              pageSize={Number(query.get("limit"))}
              pageSizes={SHOP_PAGE_SIZES}
              noun={total > 1 ? "produits" : "produit"}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}
