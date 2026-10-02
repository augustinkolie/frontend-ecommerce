import { Suspense } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/shop/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { apiAuthed } from "@/lib/api/client";
import { LinkPagination } from "@/components/ui/pagination";
import type { ProductCard as Card } from "@/lib/api/types";
import { readPageParams, SHOP_PAGE_SIZES, slicePage } from "@/lib/pagination";
import { getSettings } from "@/lib/shop";
import { RemoveFavorite } from "./remove";

export const metadata = { title: "Favoris" };

export default async function FavoritesPage({ searchParams }: PageProps<"/compte/favoris">) {
  const [items, settings] = await Promise.all([apiAuthed<Card[]>("/me/wishlist"), getSettings()]);
  const { page, pageSize } = readPageParams(await searchParams, SHOP_PAGE_SIZES);
  const view = slicePage(items, page, pageSize);
  return (
    <section aria-labelledby="fav-title">
      <h2 id="fav-title" className="mb-4 font-serif text-2xl font-normal tracking-title">
        Favoris
      </h2>
      {items.length === 0 ? (
        <EmptyState
          title="Aucun favori"
          description="Touchez le cœur sur une fiche produit pour la retrouver ici."
          action={
            <Link href="/" className="underline underline-offset-4">
              Découvrir la boutique
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
            {view.items.map((p) => (
              <div key={p.id} className="flex flex-col gap-2">
                <ProductCard product={p} currency={settings.currency} />
                <RemoveFavorite productId={p.id} />
              </div>
            ))}
          </div>
          <Suspense>
            <LinkPagination
              className="mt-12 border-t border-line pt-8"
              page={view.page}
              pageCount={view.pageCount}
              total={view.total}
              pageSize={pageSize}
              pageSizes={SHOP_PAGE_SIZES}
              noun={view.total > 1 ? "favoris" : "favori"}
            />
          </Suspense>
        </>
      )}
    </section>
  );
}
