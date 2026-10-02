import Link from "next/link";
import { SITE_URL } from "@/lib/shop";
import { JsonLd } from "./json-ld";

export type Crumb = { name: string; href: string };

/** Fil d'Ariane + données structurées BreadcrumbList. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const all = [{ name: "Accueil", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Fil d'Ariane" className="text-xs text-ink-muted">
        <ol className="flex flex-wrap items-center gap-1">
          {all.map((c, i) => (
            <li key={c.href} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden>/</span>}
              {i === all.length - 1 ? (
                <span aria-current="page" className="text-ink">{c.name}</span>
              ) : (
                <Link href={c.href} className="hover:underline hover:underline-offset-4">{c.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${SITE_URL}${c.href}` })),
        }}
      />
    </>
  );
}
