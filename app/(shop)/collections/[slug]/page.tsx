import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { activeFilterCount, Listing, listingQuery } from "@/components/shop/listing";
import { apiFetchOrNull } from "@/lib/api/client";
import type { ProductList } from "@/lib/api/types";
import { getSettings, SITE_URL } from "@/lib/shop";

export const revalidate = 300;

/** ISR à la demande : chaque page est générée à la première visite puis mise en cache. */
export function generateStaticParams() {
  return [];
}

type CollectionList = ProductList & { collection: { id: string; name: string; slug: string } };

const load = (slug: string, query: URLSearchParams) =>
  apiFetchOrNull<CollectionList>(`/collections/${encodeURIComponent(slug)}?${query}`, { tags: ["catalog", `collection:${slug}`], revalidate: 300 });

export async function generateMetadata({ params, searchParams }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug, listingQuery({}));
  if (!data) return {};
  return {
    title: data.collection.name,
    alternates: { canonical: `${SITE_URL}/collections/${slug}` },
    robots: activeFilterCount(await searchParams) > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function CollectionPage({ params, searchParams }: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const query = listingQuery(await searchParams);
  const [data, settings] = await Promise.all([load(slug, query), getSettings()]);
  if (!data) notFound();
  return (
    <Listing
      title={data.collection.name}
      breadcrumb={<Breadcrumb items={[{ name: data.collection.name, href: `/collections/${slug}` }]} />}
      data={data}
      query={query}
      currency={settings.currency}
    />
  );
}
