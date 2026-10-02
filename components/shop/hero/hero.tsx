import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import type { ContentBlock, HeroProduct } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { HeroHotspot, type HeroHotspotProduct } from "./hero-hotspot";

/** « Le lin, au naturel » → « Le lin, » / « au naturel » : retour à la ligne après la première virgule. */
function TitleLines({ title }: { title: string }) {
  const i = title.indexOf(", ");
  if (i === -1) return <>{title}</>;
  return (
    <>
      {title.slice(0, i + 1)}
      <br />
      {title.slice(i + 2)}
    </>
  );
}

/**
 * Une de l'accueil, « la chambre à acheter » : la photo occupe toute la largeur et
 * les produits visibles dessus sont cliquables (points, desktop) ou listés dessous (mobile).
 *
 * Desktop : photo bord à bord (écran moins le header, 560–880 px) ; le texte est dans un
 * bloc plein couleur de fond, collé en bas à gauche, qui chevauche la photo. Aucun voile :
 * c'est le bloc plein qui assure la lisibilité. Les points recouverts par ce bloc sont masqués.
 * Mobile : photo 4:5, texte dessous, puis la bande « Sur la photo ».
 *
 * Server Component : seul le point produit (HeroHotspot) est interactif côté client.
 */
export function Hero({ block, products, currency }: { block: ContentBlock; products: HeroProduct[]; currency: string }) {
  const items: HeroHotspotProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    href: `/p/${p.slug}`,
    price: formatPrice(p.price, currency),
    imageUrl: p.imageUrl,
    imageAlt: p.imageAlt,
    x: p.x,
    y: p.y,
  }));

  return (
    <section aria-labelledby="hero-title" className="relative">
      <div className="relative aspect-product w-full bg-surface-alt md:aspect-auto md:h-hero">
        {block.imageUrl && <Image src={block.imageUrl} alt="" fill priority sizes="100vw" className="object-cover" />}
        {items.length > 0 && (
          <div className="absolute inset-0 hidden md:block">
            {items.map((p) => (
              <HeroHotspot key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      <div data-hero-copy className="relative z-10 bg-bg px-5 pt-8 pb-12 md:absolute md:bottom-0 md:left-0 md:w-12/25 md:max-w-hero-copy md:p-12">
        <h1 id="hero-title" className="font-serif text-hero font-normal">
          <TitleLines title={block.title} />
        </h1>
        {block.subtitle && <p className="mt-6 max-w-hero-sub text-lg text-ink-muted">{block.subtitle}</p>}
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          {block.linkUrl && (
            <Link href={block.linkUrl} className={buttonClasses()}>
              {block.linkLabel ?? "Découvrir"}
            </Link>
          )}
          <Link href="/collections/nouveautes" className="inline-flex h-12 items-center underline decoration-line decoration-1 underline-offset-4 transition-colors duration-150 hover:decoration-ink">
            Voir les nouveautés
          </Link>
        </div>
      </div>

      {items.length > 0 && (
        <section aria-labelledby="hero-products-title" className="pb-12 md:hidden">
          <h2 id="hero-products-title" className="px-5 pb-4 text-sm font-medium">
            Sur la photo
          </h2>
          <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2">
            {items.map((p) => (
              <li key={p.id} className="w-36 shrink-0 snap-start">
                <Link href={p.href} className="flex flex-col gap-2">
                  <div className="relative aspect-product overflow-hidden bg-surface-alt">
                    {p.imageUrl && <Image src={p.imageUrl} alt={p.imageAlt ?? ""} fill sizes="144px" className="object-cover" />}
                  </div>
                  <span className="text-sm">{p.name}</span>
                  <span className="text-sm font-medium tabular-nums">{p.price}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
