"use client";

import { useState } from "react";
import Link from "next/link";
import { CartLineRow, FreeShippingProgress } from "@/components/shop/cart-drawer";
import { useCart } from "@/components/shop/cart-provider";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { Price } from "@/components/ui/price";
import { Skeleton } from "@/components/ui/skeleton";

export function CartPage() {
  const { cart, applyCoupon, removeCoupon, pending, error } = useCart();
  const [code, setCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);

  if (!cart) {
    return (
      <div className="grid gap-12 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (cart.items.length === 0) {
    return (
      <EmptyState
        title="Votre panier est vide"
        description="Les nouveautés de la saison vous attendent."
        action={<Link href="/collections/nouveautes" className="text-base font-medium underline underline-offset-4">Voir les nouveautés</Link>}
      />
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {error && <p className="pb-4 text-sm text-danger">{error}</p>}
        <ul className="divide-y divide-line border-y border-line">
          {cart.items.map((l) => <CartLineRow key={l.id} line={l} currency={cart.currency} />)}
        </ul>
      </div>

      <aside aria-label="Récapitulatif" className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
        <FreeShippingProgress cart={cart} />

        {cart.coupon ? (
          <div className="flex items-center justify-between text-sm">
            <span>Code <span className="font-semibold">{cart.coupon.code}</span> appliqué</span>
            <button type="button" onClick={() => void removeCoupon()} className="underline underline-offset-4">Retirer</button>
          </div>
        ) : (
          <form
            className="flex flex-col gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setCouponError(await applyCoupon(code));
            }}
          >
            <label htmlFor="coupon" className="text-sm font-medium">Code promo</label>
            <div className="flex gap-2">
              <Input id="coupon" density="admin" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} aria-invalid={!!couponError} aria-describedby={couponError ? "coupon-error" : undefined} autoComplete="off" />
              <Button type="submit" size="admin" variant="secondary" disabled={pending || !code}>Appliquer</Button>
            </div>
            {couponError && <p id="coupon-error" className="text-sm text-danger">{couponError}</p>}
          </form>
        )}

        <dl className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Sous-total</dt>
            <dd><Price amount={cart.subtotal} currency={cart.currency} size="sm" /></dd>
          </div>
          {cart.discount > 0 && (
            <div className="flex justify-between text-accent">
              <dt>Remise</dt>
              <dd className="tabular-nums">−<Price amount={cart.discount} currency={cart.currency} size="sm" className="inline-flex text-accent" /></dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Livraison estimée{cart.shippingZone ? ` (${cart.shippingZone.name})` : ""}</dt>
            <dd>{cart.shippingEstimate === 0 ? "Offerte" : <Price amount={cart.shippingEstimate} currency={cart.currency} size="sm" />}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-4 text-base font-semibold">
            <dt>Total</dt>
            <dd><Price amount={cart.total} currency={cart.currency} /></dd>
          </div>
        </dl>
        <p className="text-xs text-ink-muted">Frais de livraison définitifs selon l&apos;adresse, à l&apos;étape suivante. Retrait en boutique gratuit.</p>
        <Link href="/commande" className={buttonClasses({ fullWidth: true })}>Commander</Link>
      </aside>
    </div>
  );
}
