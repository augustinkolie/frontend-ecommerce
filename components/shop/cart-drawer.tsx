"use client";

import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Price } from "@/components/ui/price";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import type { Cart, CartLine } from "@/lib/api/types";
import { useCart } from "./cart-provider";

export function FreeShippingProgress({ cart }: { cart: Cart }) {
  if (cart.freeShippingThreshold == null || cart.items.length === 0) return null;
  const remaining = cart.freeShippingRemaining ?? 0;
  const done = remaining <= 0;
  const pct = Math.min(100, Math.round(((cart.freeShippingThreshold - remaining) / cart.freeShippingThreshold) * 100));
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {done ? "Livraison offerte." : <>Plus que <span className="font-medium tabular-nums">{formatPrice(remaining, cart.currency)}</span> pour la livraison offerte.</>}
      </p>
      <div className="h-1 w-full bg-line" aria-hidden>
        <div className={cn("h-1 transition-all duration-200 ease-out", done ? "bg-success" : "bg-ink")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CartLineRow({ line, currency }: { line: CartLine; currency: string }) {
  const { update, remove, pending, setOpen } = useCart();
  return (
    <li className="flex gap-4 py-4">
      <Link href={`/p/${line.slug}`} onClick={() => setOpen(false)} className={cn("relative w-20 shrink-0 bg-surface-alt", line.family === "LINEN" ? "aspect-linen" : "aspect-product")}>
        {line.imageUrl && <Image src={line.imageUrl} alt="" fill sizes="80px" className="object-cover" />}
      </Link>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex justify-between gap-2">
          <Link href={`/p/${line.slug}`} onClick={() => setOpen(false)} className="text-sm hover:underline">
            {line.name}
          </Link>
          <Price amount={line.lineTotal} currency={currency} size="sm" />
        </div>
        <p className="text-xs text-ink-muted">{line.attributes.map((a) => a.value).join(" · ")}</p>
        {line.quantity > line.available && <p className="text-xs text-warning">Plus que {line.available} disponible(s).</p>}
        <div className="flex items-center justify-between pt-2">
          <QuantityStepper value={line.quantity} max={Math.max(1, Math.min(line.available, 20))} onChange={(q) => void update(line.id, q)} label={`Quantité pour ${line.name}`} />
          <button type="button" disabled={pending} onClick={() => void remove(line.id)} className="h-11 text-sm text-ink-muted underline underline-offset-4 hover:text-ink">
            Retirer
          </button>
        </div>
      </div>
    </li>
  );
}

export function CartDrawer() {
  const { cart, open, setOpen, error } = useCart();
  const empty = !cart || cart.items.length === 0;
  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      title={`Panier${cart?.count ? ` (${cart.count})` : ""}`}
      description="Récapitulatif de votre panier"
      footer={
        empty ? undefined : (
          <div className="flex flex-col gap-4">
            <FreeShippingProgress cart={cart} />
            <div className="flex justify-between text-base">
              <span>Sous-total</span>
              <Price amount={cart.subtotal} currency={cart.currency} />
            </div>
            <Link href="/commande" onClick={() => setOpen(false)} className={buttonClasses({ fullWidth: true })}>
              Commander
            </Link>
            <Link href="/panier" onClick={() => setOpen(false)} className="text-center text-sm underline underline-offset-4">
              Voir le panier
            </Link>
          </div>
        )
      }
    >
      {error && <p className="pb-4 text-sm text-danger">{error}</p>}
      {empty ? (
        <EmptyState
          title="Votre panier est vide"
          description="Les nouveautés de la saison vous attendent."
          action={
            <Link href="/collections/nouveautes" onClick={() => setOpen(false)} className="text-base font-medium underline underline-offset-4">
              Voir les nouveautés
            </Link>
          }
        />
      ) : (
        <ul className="-my-4 divide-y divide-line">
          {cart.items.map((l) => (
            <CartLineRow key={l.id} line={l} currency={cart.currency} />
          ))}
        </ul>
      )}
    </Drawer>
  );
}
