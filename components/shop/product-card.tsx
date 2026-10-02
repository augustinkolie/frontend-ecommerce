import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import type { ProductCard as ProductCardData } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { discountPercent } from "@/lib/format";
import { CardActions } from "./card-actions";

export type { ProductCardData };

/**
 * Carte produit : photo en vedette, fond surface-alt, second visuel au survol, aucun arrondi marqué ni ombre.
 * Favori et ajout rapide au panier sont posés sur la photo, à côté du lien (jamais dedans).
 */
export function ProductCard({ product, currency, priority = false }: { product: ProductCardData; currency?: string; priority?: boolean }) {
  const discount = product.compareAtPrice ? discountPercent(product.price, product.compareAtPrice) : 0;
  const ratio = product.family === "LINEN" ? "aspect-linen" : "aspect-product";
  const sizes = "(min-width: 1024px) 25vw, 50vw";

  return (
    <article className="group flex flex-col gap-3">
      <div className="relative">
        <Link href={`/p/${product.slug}`} tabIndex={-1} aria-hidden className="block">
          <div className={cn("relative overflow-hidden bg-surface-alt", ratio)}>
            {product.imageUrl && <Image src={product.imageUrl} alt={product.imageAlt ?? product.name} fill sizes={sizes} priority={priority} className="object-cover" />}
            {product.hoverImageUrl && (
              <Image src={product.hoverImageUrl} alt="" fill sizes={sizes} className="object-cover opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100" />
            )}
            <div className="absolute top-2 left-2 flex gap-1">
              {discount > 0 && <Badge tone="accent">-{discount} %</Badge>}
              {product.isNew && !discount && <Badge tone="ink">Nouveau</Badge>}
              {!product.inStock && <Badge>Épuisé</Badge>}
            </div>
          </div>
        </Link>
        <CardActions product={product} currency={currency} />
      </div>
      <Link href={`/p/${product.slug}`} className="flex flex-col gap-1">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm text-ink">{product.name}</h3>
          <Price amount={product.price} compareAt={product.compareAtPrice} currency={currency} size="sm" />
        </div>
      </Link>
      {product.colors.length > 1 && (
        <ul className="flex items-center gap-1" aria-label={`${product.colors.length} coloris`}>
          {product.colors.slice(0, 5).map((c) => (
            <li key={c.value} title={c.value} className="size-3 rounded-full border border-line" style={{ backgroundColor: c.hex ?? undefined }} />
          ))}
          {product.colors.length > 5 && <li className="text-xs text-ink-muted">+{product.colors.length - 5}</li>}
        </ul>
      )}
    </article>
  );
}

export function ProductCardSkeleton({ family }: { family?: ProductCardData["family"] }) {
  return (
    <div aria-hidden className="flex flex-col gap-3">
      <div className={cn("animate-pulse bg-surface-alt", family === "LINEN" ? "aspect-linen" : "aspect-product")} />
      <div className="h-5 w-3/4 animate-pulse rounded-sm bg-line" />
      <div className="h-5 w-1/3 animate-pulse rounded-sm bg-line" />
    </div>
  );
}

export function ProductGrid({ products, currency, priorityCount = 0 }: { products: ProductCardData[]; currency?: string; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-6">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} currency={currency} priority={i < priorityCount} />
      ))}
    </div>
  );
}
