import Link from "next/link";
import { ProductGrid } from "@/components/shop/product-card";
import { apiFetch } from "@/lib/api/client";
import type { HomeContent } from "@/lib/api/types";
import { getSettings } from "@/lib/shop";

/** 404 : message sobre + suggestions de produits. */
export default async function NotFound() {
  const [home, settings] = await Promise.all([
    apiFetch<HomeContent>("/content/home", { tags: ["home", "catalog"], revalidate: 300 }).catch(() => null),
    getSettings().catch(() => null),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 pt-16 md:px-8">
      <div className="flex max-w-xl flex-col gap-4">
        <p className="text-xs font-semibold tracking-caps text-ink-muted uppercase">Erreur 404</p>
        <h1 className="font-serif text-4xl font-normal tracking-title md:text-5xl">Cette page n&apos;existe pas</h1>
        <p className="text-lg text-ink-muted">Le produit a peut-être été retiré ou le lien est incorrect.</p>
        <div className="flex gap-6 pt-2">
          <Link href="/" className="text-base font-medium underline underline-offset-4">Retour à l&apos;accueil</Link>
          <Link href="/recherche" className="text-base font-medium underline underline-offset-4">Rechercher</Link>
        </div>
      </div>
      {home && home.bestSellers.length > 0 && (
        <section aria-labelledby="suggest-title" className="mt-16 border-t border-line pt-12">
          <h2 id="suggest-title" className="mb-8 font-serif text-2xl font-normal tracking-title">Nos meilleures ventes</h2>
          <ProductGrid products={home.bestSellers.slice(0, 4)} currency={settings?.currency} />
        </section>
      )}
    </div>
  );
}
