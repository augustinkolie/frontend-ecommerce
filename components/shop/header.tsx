import Link from "next/link";
import { categoryHref, getCategories, getSettings } from "@/lib/shop";
import { Logo } from "./logo";
import { HeaderIcons, MobileMenu } from "./header-actions";

export async function Header() {
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg">
      {settings.freeShippingThreshold != null && (
        <p className="bg-ink px-4 py-2 text-center text-xs text-on-ink">
          Livraison offerte à Conakry dès {new Intl.NumberFormat("fr-FR").format(settings.freeShippingThreshold)} {settings.currency} · Retours sous 14 jours
        </p>
      )}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-2 md:px-8">
        <MobileMenu categories={categories} shopName={settings.shopName} />
        <Link href="/" aria-label={`${settings.shopName}, accueil`}>
          <Logo name={settings.shopName} />
        </Link>
        <nav aria-label="Catégories principales" className="ml-8 hidden flex-1 lg:block">
          <ul className="flex gap-8">
            {categories.map((c) => (
              <li key={c.id} className="group relative">
                <Link href={categoryHref(c)} className="flex h-16 items-center text-sm hover:underline hover:underline-offset-4">
                  {c.name}
                </Link>
                {c.children.length > 0 && (
                  <div className="invisible absolute top-full left-0 z-40 min-w-56 border border-line bg-surface p-2 opacity-0 transition-opacity duration-150 ease-out group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul>
                      {c.children.map((s) => (
                        <li key={s.id}>
                          <Link href={categoryHref(s)} className="flex h-10 items-center rounded-sm px-3 text-sm hover:bg-surface-alt">
                            {s.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
            <li>
              <Link href="/collections/nouveautes" className="flex h-16 items-center text-sm hover:underline hover:underline-offset-4">
                Nouveautés
              </Link>
            </li>
          </ul>
        </nav>
        <div className="ml-auto">
          <HeaderIcons />
        </div>
      </div>
    </header>
  );
}
