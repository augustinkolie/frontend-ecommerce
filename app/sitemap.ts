import type { MetadataRoute } from "next";
import { apiFetch } from "@/lib/api/client";
import type { CategoryNode, ProductList } from "@/lib/api/types";
import { SITE_URL } from "@/lib/shop";

export const revalidate = 3600;

/** Sitemap dynamique : accueil, catégories, collections, fiches produit, pages d'aide. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await apiFetch<CategoryNode[]>("/categories", { tags: ["catalog"] });
  const flat = (nodes: CategoryNode[]): CategoryNode[] => nodes.flatMap((n) => [n, ...flat(n.children)]);

  const products: ProductList["items"] = [];
  let cursor: string | null = null;
  do {
    const page: ProductList = await apiFetch<ProductList>(`/products?limit=60${cursor ? `&cursor=${cursor}` : ""}`, { tags: ["catalog"] });
    products.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);

  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...flat(categories).map((c) => ({ url: `${SITE_URL}/c/${c.path.join("/")}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    { url: `${SITE_URL}/collections/nouveautes`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    ...products.map((p) => ({
      url: `${SITE_URL}/p/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: p.imageUrl ? [p.imageUrl] : undefined,
    })),
    ...["guide-des-tailles", "livraison", "retours", "cgv", "confidentialite"].map((s) => ({ url: `${SITE_URL}/${s}`, changeFrequency: "monthly" as const, priority: 0.3 })),
  ];
}
