"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LayoutGrid, LogOut, MapPin, Package, RotateCcw, Settings2, User as UserIcon } from "lucide-react";
import { useCart } from "@/components/shop/cart-provider";
import { api } from "@/lib/api/browser";
import { cn } from "@/lib/cn";

const links = [
  { href: "/compte", label: "Vue d'ensemble", icon: LayoutGrid },
  { href: "/compte/commandes", label: "Commandes", icon: Package },
  { href: "/compte/adresses", label: "Adresses", icon: MapPin },
  { href: "/compte/favoris", label: "Favoris", icon: Heart },
  { href: "/compte/retours", label: "Retours", icon: RotateCcw },
  { href: "/compte/profil", label: "Profil", icon: UserIcon },
];

/**
 * Navigation du compte : liste verticale sur desktop (page active marquée d'un trait),
 * onglets défilants soulignés sur mobile. Administration et déconnexion à part.
 */
export function AccountNav({ isStaff }: { isStaff: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { refresh } = useCart();

  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    await refresh();
    router.push("/");
    router.refresh();
  }

  const item = "flex h-11 items-center gap-3 text-sm whitespace-nowrap transition-colors duration-150";

  return (
    <nav aria-label="Mon compte" className="-mx-4 overflow-x-auto px-4 lg:sticky lg:top-28 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-6 border-b border-line lg:flex-col lg:gap-0 lg:border-b-0 lg:border-l">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/compte" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  item,
                  "-mb-px border-b-2 lg:mb-0 lg:-ml-px lg:border-b-0 lg:border-l-2 lg:pl-4",
                  active ? "border-ink font-medium text-ink" : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                <Icon aria-hidden size={18} strokeWidth={1.5} className="hidden lg:block" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <ul className="mt-6 hidden border-t border-line pt-4 lg:block">
        {isStaff && (
          <li>
            <Link href="/admin" className={cn(item, "pl-4 text-ink-muted hover:text-ink")}>
              <Settings2 aria-hidden size={18} strokeWidth={1.5} />
              Administration
            </Link>
          </li>
        )}
        <li>
          <button type="button" onClick={() => void logout()} className={cn(item, "w-full pl-4 text-left text-ink-muted hover:text-ink")}>
            <LogOut aria-hidden size={18} strokeWidth={1.5} />
            Se déconnecter
          </button>
        </li>
      </ul>

      {/* Mobile : actions secondaires sous les onglets. */}
      <div className="flex gap-6 pt-3 lg:hidden">
        {isStaff && (
          <Link href="/admin" className="inline-flex h-11 items-center text-sm text-ink-muted underline-offset-4 hover:underline">
            Administration
          </Link>
        )}
        <button type="button" onClick={() => void logout()} className="inline-flex h-11 items-center text-sm text-ink-muted underline-offset-4 hover:underline">
          Se déconnecter
        </button>
      </div>
    </nav>
  );
}
