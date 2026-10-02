"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Drawer } from "@/components/ui/dialog";
import type { CategoryNode } from "@/lib/api/types";
import { useCart } from "./cart-provider";

const iconBtn = "inline-flex size-11 items-center justify-center rounded-sm text-ink hover:bg-surface-alt";

export function CartButton() {
  const { cart, setOpen } = useCart();
  const count = cart?.count ?? 0;
  return (
    <button type="button" onClick={() => setOpen(true)} className={`${iconBtn} relative`} aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}>
      <ShoppingBag aria-hidden size={20} strokeWidth={1.5} />
      {count > 0 && (
        <span className="absolute top-1 right-1 inline-flex size-5 items-center justify-center rounded-full bg-ink text-xs font-semibold text-on-ink tabular-nums">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

export function HeaderIcons() {
  return (
    <div className="flex items-center">
      <Link href="/recherche" className={iconBtn} aria-label="Rechercher">
        <Search aria-hidden size={20} strokeWidth={1.5} />
      </Link>
      <ThemeToggle className={iconBtn} />
      <Link href="/compte" className={`${iconBtn} hidden sm:inline-flex`} aria-label="Mon compte">
        <User aria-hidden size={20} strokeWidth={1.5} />
      </Link>
      <CartButton />
    </div>
  );
}

export function MobileMenu({ categories, shopName }: { categories: CategoryNode[]; shopName: string }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <button type="button" className={`${iconBtn} lg:hidden`} aria-label="Menu" onClick={() => setOpen(true)}>
        <Menu aria-hidden size={20} strokeWidth={1.5} />
      </button>
      <Drawer open={open} onOpenChange={setOpen} side="left" title={shopName} description="Navigation">
        <nav aria-label="Catégories" className="flex flex-col gap-6">
          {categories.map((c) => (
            <div key={c.id} className="flex flex-col gap-2">
              <Link href={`/c/${c.path.join("/")}`} onClick={close} className="font-serif text-2xl tracking-title">
                {c.name}
              </Link>
              <ul className="flex flex-col">
                {c.children.map((s) => (
                  <li key={s.id}>
                    <Link href={`/c/${s.path.join("/")}`} onClick={close} className="flex h-11 items-center text-base text-ink-muted hover:text-ink">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex flex-col border-t border-line pt-4">
            <Link href="/compte" onClick={close} className="flex h-11 items-center text-base">Mon compte</Link>
            <Link href="/guide-des-tailles" onClick={close} className="flex h-11 items-center text-base">Guide des tailles</Link>
            <Link href="/livraison" onClick={close} className="flex h-11 items-center text-base">Livraison & retours</Link>
          </div>
        </nav>
      </Drawer>
    </>
  );
}
