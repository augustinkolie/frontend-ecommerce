import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Hero } from "@/components/shop/hero/hero";
import { ProductGrid } from "@/components/shop/product-card";
import { apiFetch } from "@/lib/api/client";
import type { HomeContent } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { getSettings, SITE_URL } from "@/lib/shop";

export const revalidate = 300; // ISR 5 min

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { absolute: `${s.shopName} — linge de maison, vêtements et chaussures` },
    description: "Linge de maison en lin et percale, vêtements, t-shirts et chaussures. Livraison à Conakry en 24 à 48 h.",
    alternates: { canonical: SITE_URL },
  };
}

function SectionHeader({ title, href, label }: { title: string; href?: string; label?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <h2 className="font-serif text-3xl font-normal tracking-title md:text-4xl">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-2 text-sm underline-offset-4 hover:underline">
          {label}
          <ArrowRight aria-hidden size={16} strokeWidth={1.5} />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [home, settings] = await Promise.all([
    apiFetch<HomeContent>("/content/home", { tags: ["home", "catalog"], revalidate: 300 }),
    getSettings(),
  ]);
  const hero = home.hero[0];

  return (
    <>
      {hero && (
        <Hero block={hero} products={home.heroProducts} currency={settings.currency} />
      )}

      <div className="mx-auto flex max-w-7xl flex-col gap-24 px-4 pt-16 md:px-8">
        {home.featured.length > 0 && (
          <section aria-label="Collections">
            <div className="grid gap-8 md:grid-cols-2">
              {home.featured.map((b) => (
                <Link key={b.id} href={b.linkUrl ?? "/"} className="group flex flex-col gap-4">
                  <div className="relative aspect-feature overflow-hidden bg-surface-alt">
                    {b.imageUrl && <Image src={b.imageUrl} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-opacity duration-200 ease-out group-hover:opacity-90" />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="font-serif text-2xl font-normal tracking-title">{b.title}</h2>
                    {b.subtitle && <p className="text-sm text-ink-muted">{b.subtitle}</p>}
                    <span className="pt-2 text-sm underline underline-offset-4">{b.linkLabel ?? "Voir"}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="new-title">
          <div id="new-title">
            <SectionHeader title="Nouveautés" href="/collections/nouveautes" label="Tout voir" />
          </div>
          <ProductGrid products={home.newArrivals} currency={settings.currency} />
        </section>

        <section aria-labelledby="best-title">
          <div id="best-title">
            <SectionHeader title="Meilleures ventes" />
          </div>
          <ProductGrid products={home.bestSellers} currency={settings.currency} />
        </section>

        <section aria-label="Nos engagements" className="grid gap-8 border-t border-line pt-12 md:grid-cols-3">
          {[
            {
              icon: Truck,
              title: "Livraison rapide",
              text: settings.freeShippingThreshold
                ? `24 à 48 h à Conakry, offerte dès ${formatPrice(settings.freeShippingThreshold, settings.currency)}.`
                : "24 à 48 h à Conakry.",
            },
            { icon: RotateCcw, title: "Retours sous 14 jours", text: "Un article ne convient pas ? Retour simple depuis votre compte." },
            { icon: ShieldCheck, title: "Paiement au choix", text: settings.paymentMethods.map((m) => m.label).join(", ") + "." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col gap-2">
              <Icon aria-hidden size={20} strokeWidth={1.5} />
              <h2 className="text-base font-semibold">{title}</h2>
              <p className="text-sm text-ink-muted">{text}</p>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
