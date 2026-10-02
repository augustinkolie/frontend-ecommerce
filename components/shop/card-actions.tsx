"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { Price } from "@/components/ui/price";
import { api, errorMessage } from "@/lib/api/browser";
import type { ProductCard, ProductDetail, StockLevel } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { useOptionalCart } from "./cart-provider";
import { ColorSwatches } from "./color-swatch";
import { SizeSelector } from "./size-selector";
import { useWishlist } from "./wishlist-provider";

type Loaded = { detail: ProductDetail; stock: Map<string, number> };

/**
 * Actions rapides posées sur la photo d'une carte produit :
 * favori (en haut à droite) et ajout au panier (bas de la photo ; au survol sur desktop,
 * icône toujours visible sur mobile). Une seule variante : ajout direct ; sinon panneau
 * d'ajout rapide (coloris, taille, stock temps réel).
 */
export function CardActions({ product, currency }: { product: ProductCard; currency?: string }) {
  const cart = useOptionalCart();
  const wishlist = useWishlist();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cart) return null;
  const wished = wishlist?.has(product.id) ?? false;

  async function load(): Promise<Loaded | null> {
    if (loaded) return loaded;
    setLoading(true);
    setError(null);
    try {
      const [detail, levels] = await Promise.all([api<ProductDetail>(`/products/${product.slug}`), api<StockLevel[]>(`/products/${product.id}/stock`)]);
      const next = { detail, stock: new Map(levels.map((l) => [l.variantId, l.available])) };
      setLoaded(next);
      return next;
    } catch (err) {
      setError(errorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function quickAdd() {
    const data = await load();
    if (!data) {
      setOpen(true);
      return;
    }
    const available = data.detail.variants.filter((v) => (data.stock.get(v.id) ?? 0) > 0);
    // Une seule variante en stock et aucune option à choisir : ajout direct.
    if (data.detail.variants.length === 1 && available.length === 1) {
      await cart!.add(available[0]!.id, 1);
      return;
    }
    setOpen(true);
  }

  const addLabel = `Ajouter ${product.name} au panier`;

  return (
    <>
      {wishlist && (
        <button
          type="button"
          onClick={() => void wishlist.toggle(product.id)}
          disabled={wishlist.pendingId === product.id}
          aria-pressed={wished}
          aria-label={wished ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
          className="absolute top-1 right-1 z-10 flex size-11 items-center justify-center"
        >
          <span className="flex size-9 items-center justify-center rounded-sm bg-surface text-ink transition-colors duration-150 hover:bg-surface-alt">
            <Heart aria-hidden size={18} strokeWidth={1.5} className={cn(wished && "fill-ink")} />
          </span>
        </button>
      )}

      {product.inStock && (
        <>
          {/* Desktop : bouton pleine largeur au survol ou au focus clavier. */}
          <button
            type="button"
            onClick={() => void quickAdd()}
            disabled={loading || cart.pending}
            aria-label={addLabel}
            className="absolute inset-x-2 bottom-2 z-10 hidden h-11 items-center justify-center rounded-sm bg-ink text-sm font-medium text-on-ink opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-60 md:flex"
          >
            {loading ? "Chargement…" : "Ajouter au panier"}
          </button>
          {/* Mobile : icône toujours visible. */}
          <button
            type="button"
            onClick={() => void quickAdd()}
            disabled={loading || cart.pending}
            aria-label={addLabel}
            className="absolute right-1 bottom-1 z-10 flex size-11 items-center justify-center md:hidden"
          >
            <span className="flex size-9 items-center justify-center rounded-sm bg-ink text-on-ink">
              <ShoppingBag aria-hidden size={18} strokeWidth={1.5} />
            </span>
          </button>
        </>
      )}

      <Drawer open={open} onOpenChange={setOpen} title="Ajout rapide" description={product.name}>
        {error ? (
          <p className="text-sm text-danger" role="alert">{error}</p>
        ) : loaded ? (
          <QuickAddForm product={product} data={loaded} currency={currency} onDone={() => setOpen(false)} />
        ) : (
          <p className="text-sm text-ink-muted">Chargement…</p>
        )}
      </Drawer>
    </>
  );
}

function QuickAddForm({ product, data, currency, onDone }: { product: ProductCard; data: Loaded; currency?: string; onDone: () => void }) {
  const cart = useOptionalCart()!;
  const { detail, stock } = data;
  const inStock = (id: string) => (stock.get(id) ?? 0) > 0;
  const [selection, setSelection] = useState<Record<string, string>>(() => {
    // Coloris présélectionné : le premier qui a du stock.
    const color = detail.options.find((o) => o.code === "color");
    const first = color?.values.find((v) => detail.variants.some((x) => x.options.color === v.value && inStock(x.id)));
    const initial: Record<string, string> = {};
    if (first) initial.color = first.value;
    return initial;
  });
  const [missing, setMissing] = useState(false);

  const variant = useMemo(() => detail.variants.find((v) => detail.options.every((o) => v.options[o.code] === selection[o.code])), [detail, selection]);
  const available = (code: string, value: string) =>
    detail.variants.some((v) => v.options[code] === value && (code === "color" || !selection.color || v.options.color === selection.color) && inStock(v.id));
  const image = detail.images.find((i) => !selection.color || i.color === selection.color) ?? detail.images[0];

  async function submit() {
    if (!variant || !inStock(variant.id)) {
      setMissing(true);
      return;
    }
    if (await cart.add(variant.id, 1)) onDone();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4">
        <div className={cn("relative w-24 shrink-0 overflow-hidden bg-surface-alt", product.family === "LINEN" ? "aspect-linen" : "aspect-product")}>
          {image && <Image src={image.url} alt={image.alt} fill sizes="96px" className="object-cover" />}
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-serif text-xl">{detail.name}</p>
          <Price amount={variant?.price ?? product.price} compareAt={variant ? variant.compareAtPrice : product.compareAtPrice} currency={currency} size="base" />
          <Link href={`/p/${detail.slug}`} className="text-sm underline decoration-line underline-offset-4 hover:decoration-ink">Voir la fiche complète</Link>
        </div>
      </div>

      {detail.options.map((o) =>
        o.code === "color" ? (
          <ColorSwatches
            key={o.code}
            name={`qa-${o.code}`}
            legend={o.name}
            value={selection[o.code]}
            onChange={(v) => setSelection((s) => ({ ...s, [o.code]: v }))}
            options={o.values.map((v) => ({ value: v.value, label: v.value, hex: v.hex ?? "#EFEAE2", available: available(o.code, v.value) }))}
          />
        ) : (
          <SizeSelector
            key={o.code}
            name={`qa-${o.code}`}
            legend={o.name}
            value={selection[o.code]}
            onChange={(v) => {
              setMissing(false);
              setSelection((s) => ({ ...s, [o.code]: v }));
            }}
            options={o.values.map((v) => ({ value: v.value, label: v.value, available: available(o.code, v.value) }))}
          />
        ),
      )}

      <div className="flex flex-col gap-2">
        {missing && (
          <p className="text-sm text-danger" role="alert">
            Choisissez une {detail.options.find((o) => o.code !== "color")?.name.toLowerCase() ?? "option"} disponible.
          </p>
        )}
        {cart.error && <p className="text-sm text-danger" role="alert">{cart.error}</p>}
        <Button fullWidth onClick={() => void submit()} disabled={cart.pending}>
          {cart.pending ? "Ajout…" : "Ajouter au panier"}
        </Button>
      </div>
    </div>
  );
}
