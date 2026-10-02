"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/shop/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { api } from "@/lib/api/browser";
import type { ProductCard as Card } from "@/lib/api/types";
import { readPageParams, SHOP_PAGE_SIZES } from "@/lib/pagination";

type Result = { items: Card[]; total: number; page: number; pageCount: number };

/** Recherche instantanée dès 2 caractères (tolérance aux fautes côté Meilisearch). */
export function SearchBox({ currency }: { currency: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(params.get("q") ?? "");
  const initial = readPageParams(Object.fromEntries(params), SHOP_PAGE_SIZES);
  const [page, setPage] = useState(initial.page);
  const [pageSize, setPageSize] = useState(initial.pageSize);
  const [fetched, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api<Result>(`/search?q=${encodeURIComponent(term)}&limit=${pageSize}&page=${page}`, { signal: ctrl.signal });
        setResult(r);
        const next = new URLSearchParams({ q: term });
        if (page > 1) next.set("page", String(page));
        if (pageSize !== SHOP_PAGE_SIZES[2]) next.set("par", String(pageSize));
        router.replace(`${pathname}?${next}`, { scroll: false });
      } catch {
        /* requête annulée ou erreur réseau */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, page, pageSize, pathname, router]);

  const result = q.trim().length >= 2 ? fetched : null;

  return (
    <div className="flex flex-col gap-8">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
        <label htmlFor="q" className="sr-only">Rechercher un produit</label>
        <Search aria-hidden size={20} strokeWidth={1.5} className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-ink-muted" />
        <input
          ref={input}
          id="q"
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Drap, chemise en lin, basket…"
          autoComplete="off"
          className="h-16 w-full border-b border-ink bg-transparent pr-12 pl-8 font-serif text-2xl tracking-title placeholder:text-ink-muted focus-visible:outline-none md:text-3xl"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setPage(1);
            }} className="absolute top-1/2 right-0 inline-flex size-11 -translate-y-1/2 items-center justify-center" aria-label="Effacer">
            <X aria-hidden size={20} strokeWidth={1.5} />
          </button>
        )}
      </form>

      <p className="text-sm text-ink-muted" aria-live="polite">
        {q.trim().length < 2
          ? "Saisissez au moins 2 caractères."
          : loading
            ? "Recherche…"
            : result
              ? `${result.total} résultat${result.total > 1 ? "s" : ""}`
              : ""}
      </p>

      {loading && !result ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : result && result.items.length === 0 ? (
        <EmptyState title="Aucun résultat" description="Vérifiez l'orthographe ou essayez un terme plus général : « lin », « basket », « drap »." />
      ) : result ? (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-6">
            {result.items.map((p) => <ProductCard key={p.id} product={p} currency={currency} />)}
          </div>
          <Pagination
            className="mt-8 border-t border-line pt-8"
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={pageSize}
            pageSizes={SHOP_PAGE_SIZES}
            noun={result.total > 1 ? "produits" : "produit"}
            onPageChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
          />
        </>
      ) : null}
    </div>
  );
}
