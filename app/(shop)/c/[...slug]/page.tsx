import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { activeFilterCount, Listing, listingQuery } from "@/components/shop/listing";
import { apiFetchOrNull } from "@/lib/api/client";
import type { CategoryNode, ProductList } from "@/lib/api/types";
import { categoryHref, findCategory, getCategories, getSettings, SITE_URL } from "@/lib/shop";

export const revalidate = 300;

async function resolve(slug: string[]) {
  const roots = await getCategories();
  const category = findCategory(roots, slug[slug.length - 1]!);
  if (!category || category.path.join("/") !== slug.join("/")) return null;
  const parent = category.path.length > 1 ? findCategory(roots, category.path[category.path.length - 2]!) : undefined;
  return { category, parent, roots };
}

export async function generateMetadata({ params, searchParams }: PageProps<"/c/[...slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) return {};
  const filters = activeFilterCount(await searchParams);
  const canonical = `${SITE_URL}${categoryHref(r.category)}`;
  return {
    title: r.category.name,
    description: `${r.category.name} : découvrez notre sélection, livrée en 24 à 48 h à Conakry.`,
    // Pages filtrées : canonical vers la catégorie ; au-delà d'un filtre, non indexées.
    alternates: { canonical },
    robots: filters > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/c/[...slug]">) {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) notFound();
  const sp = await searchParams;
  const query = listingQuery(sp, { category: r.category.slug });
  const [data, settings] = await Promise.all([
    apiFetchOrNull<ProductList>(`/products?${query}`, { tags: ["catalog"], revalidate: 300 }),
    getSettings(),
  ]);
  if (!data) notFound();

  const trail: CategoryNode[] = [];
  let cur: CategoryNode | undefined = r.category;
  while (cur) {
    trail.unshift(cur);
    cur = cur.path.length > 1 ? findCategory(r.roots, cur.path[cur.path.length - 2]!) : undefined;
  }
  const siblingsOf = r.category.children.length ? r.category : r.parent;

  return (
    <Listing
      title={r.category.name}
      breadcrumb={<Breadcrumb items={trail.map((c) => ({ name: c.name, href: categoryHref(c) }))} />}
      subnav={
        siblingsOf
          ? [
              { name: "Tout", href: categoryHref(siblingsOf), active: siblingsOf.id === r.category.id },
              ...siblingsOf.children.map((c) => ({ name: c.name, href: categoryHref(c), active: c.id === r.category.id })),
            ]
          : undefined
      }
      data={data}
      query={query}
      currency={settings.currency}
    />
  );
}
