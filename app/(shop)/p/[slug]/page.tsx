import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { JsonLd } from "@/components/shop/json-ld";
import { ProductGrid } from "@/components/shop/product-card";
import { Gallery, ProductProvider, PurchasePanel } from "@/components/shop/product-view";
import { ReviewForm } from "@/components/shop/review-form";
import { apiFetch, apiFetchOrNull } from "@/lib/api/client";
import type { ProductDetail, Review, StockLevel } from "@/lib/api/types";
import { getSettings, SITE_URL } from "@/lib/shop";
import { SIZE_GUIDES } from "@/lib/size-guide";

export const revalidate = 300;

/** ISR à la demande : chaque page est générée à la première visite puis mise en cache. */
export function generateStaticParams() {
  return [];
}

const load = (slug: string) =>
  apiFetchOrNull<ProductDetail>(`/products/${encodeURIComponent(slug)}`, { tags: ["catalog", `product-slug:${slug}`], revalidate: 300 });

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) return {};
  const image = p.images[0];
  return {
    title: p.seoTitle ? { absolute: p.seoTitle } : p.name,
    description: p.seoDescription ?? p.description.slice(0, 160),
    alternates: { canonical: `${SITE_URL}/p/${p.slug}` },
    openGraph: { title: p.name, description: p.seoDescription ?? undefined, images: image ? [{ url: image.url, alt: image.alt }] : undefined },
  };
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden size={16} strokeWidth={1.5} className={n <= Math.round(value) ? "fill-ink text-ink" : "text-line"} />
      ))}
    </span>
  );
}

export default async function ProductPage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const product = await load(slug);
  if (!product) notFound();
  const [settings, reviews, stock] = await Promise.all([
    getSettings(),
    apiFetch<Review[]>(`/products/${product.id}/reviews`, { tags: [`product:${product.id}`], revalidate: 300 }),
    apiFetch<StockLevel[]>(`/products/${product.id}/stock`, { revalidate: 60 }).catch(() => [] as StockLevel[]),
  ]);
  const inStock = stock.some((s) => s.available > 0);
  const prices = product.variants.map((v) => v.price);
  const details = Object.entries(product.details);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-24 md:px-8 md:pb-0">
      <Breadcrumb
        items={[
          ...product.breadcrumb.map((c) => ({ name: c.name, href: `/c/${c.path.join("/")}` })),
          { name: product.name, href: `/p/${product.slug}` },
        ]}
      />

      <ProductProvider product={product}>
        <div className="grid gap-8 pt-6 md:grid-cols-2 md:gap-12">
          <Gallery />
          <div className="md:sticky md:top-24 md:self-start">
            <PurchasePanel currency={settings.currency} sizeGuide={SIZE_GUIDES[product.family]} />
          </div>
        </div>
      </ProductProvider>

      <div className="grid gap-12 border-t border-line pt-12 mt-16 md:grid-cols-3">
        <section aria-labelledby="desc-title" className="md:col-span-2">
          <h2 id="desc-title" className="mb-4 font-serif text-2xl font-normal tracking-title">Description</h2>
          <p className="max-w-prose text-base">{product.description}</p>
        </section>
        <section aria-labelledby="care-title" className="flex flex-col gap-6">
          {(details.length > 0 || product.material) && (
            <div>
              <h2 id="care-title" className="mb-4 text-xs font-semibold tracking-caps text-ink-muted uppercase">Composition & détails</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {product.material && (
                  <>
                    <dt className="text-ink-muted">Matière</dt>
                    <dd>{product.material}</dd>
                  </>
                )}
                {details.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-ink-muted">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {product.care && (
            <div>
              <h2 className="mb-2 text-xs font-semibold tracking-caps text-ink-muted uppercase">Entretien</h2>
              <p className="text-sm">{product.care}</p>
            </div>
          )}
        </section>
      </div>

      <section id="avis" aria-labelledby="reviews-title" className="mt-16 flex flex-col gap-8 border-t border-line pt-12">
        <div className="flex flex-wrap items-baseline gap-4">
          <h2 id="reviews-title" className="font-serif text-2xl font-normal tracking-title">Avis clients</h2>
          {product.reviews.average != null && (
            <p className="flex items-center gap-2 text-sm">
              <Stars value={product.reviews.average} />
              <span className="tabular-nums">{product.reviews.average.toLocaleString("fr-FR")} / 5 · {product.reviews.count} avis</span>
            </p>
          )}
        </div>
        {reviews.length === 0 ? (
          <p className="text-sm text-ink-muted">Aucun avis pour l&apos;instant.</p>
        ) : (
          <ul className="grid gap-8 md:grid-cols-2">
            {reviews.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 border-t-2 border-line pt-3">
                <div className="flex items-center justify-between gap-2">
                  <Stars value={r.rating} />
                  <span className="text-xs text-ink-muted">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
                <p className="text-sm">{r.text}</p>
                <p className="text-xs text-ink-muted">{r.author} · Achat vérifié</p>
                {r.reply && <p className="border-l-2 border-line pl-3 text-sm text-ink-muted">Réponse de {settings.shopName} : {r.reply}</p>}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold">Donner mon avis</h3>
          <ReviewForm productId={product.id} slug={product.slug} />
        </div>
      </section>

      {product.related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-16 border-t border-line pt-12">
          <h2 id="related-title" className="mb-8 font-serif text-2xl font-normal tracking-title">Vous aimerez aussi</h2>
          <ProductGrid products={product.related.slice(0, 4)} currency={settings.currency} />
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          image: product.images.map((i) => i.url),
          sku: product.variants[0]?.sku,
          brand: { "@type": "Brand", name: settings.shopName },
          material: product.material ?? undefined,
          ...(product.reviews.count
            ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.reviews.average, reviewCount: product.reviews.count } }
            : {}),
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: settings.currency,
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            offerCount: product.variants.length,
            availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${SITE_URL}/p/${product.slug}`,
          },
        }}
      />
    </div>
  );
}
