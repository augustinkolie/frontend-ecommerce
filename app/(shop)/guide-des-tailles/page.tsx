import type { Metadata } from "next";
import { SizeGuideTable } from "@/components/shop/size-guide-table";
import { SITE_URL } from "@/lib/shop";
import { SIZE_GUIDES } from "@/lib/size-guide";

export const metadata: Metadata = {
  title: "Guide des tailles",
  description: "Tableaux de correspondance pour les vêtements, t-shirts, chaussures et le linge de maison.",
  alternates: { canonical: `${SITE_URL}/guide-des-tailles` },
};

export default function SizeGuidePage() {
  const order = ["CLOTHING", "TSHIRT", "SHOES", "LINEN"] as const;
  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 md:px-8">
      <h1 className="font-serif text-4xl font-normal tracking-title md:text-5xl">Guide des tailles</h1>
      <nav aria-label="Familles" className="mt-6 flex flex-wrap gap-2">
        {order.map((f) => (
          <a key={f} href={`#${f.toLowerCase()}`} className="inline-flex h-11 items-center rounded-sm border border-line bg-surface px-4 text-sm hover:border-ink">
            {SIZE_GUIDES[f].title}
          </a>
        ))}
      </nav>
      <div className="mt-12 flex flex-col gap-16">
        {order.map((f) => (
          <section key={f} id={f.toLowerCase()} aria-labelledby={`${f}-title`} className="flex scroll-mt-24 flex-col gap-4">
            <h2 id={`${f}-title`} className="font-serif text-2xl font-normal tracking-title">{SIZE_GUIDES[f].title}</h2>
            <div className="max-w-3xl">
              <SizeGuideTable guide={SIZE_GUIDES[f]} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
