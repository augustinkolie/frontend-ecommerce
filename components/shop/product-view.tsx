"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, ZoomIn } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/field";
import { Price } from "@/components/ui/price";
import { api, errorMessage } from "@/lib/api/browser";
import { ApiRequestError } from "@/lib/api/errors";
import type { ProductDetail, StockLevel } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import type { SizeTable } from "@/lib/size-guide";
import { useCart } from "./cart-provider";
import { ColorSwatches } from "./color-swatch";
import { SizeGuideTable } from "./size-guide-table";
import { SizeSelector } from "./size-selector";
import { StockStatus } from "./stock-status";

type State = {
  product: ProductDetail;
  selection: Record<string, string>;
  select: (code: string, value: string) => void;
  stock: Map<string, StockLevel> | null;
  variant: ProductDetail["variants"][number] | undefined;
};

const Ctx = createContext<State | null>(null);
const useProduct = () => useContext(Ctx)!;

/** État partagé de la fiche : sélection de variante + stock temps réel (lu côté client). */
export function ProductProvider({ product, children }: { product: ProductDetail; children: ReactNode }) {
  const [selection, setSelection] = useState<Record<string, string>>(() => {
    // Coloris pré-sélectionné (le premier) ; la taille reste à choisir.
    const color = product.options.find((o) => o.code === "color");
    const single = Object.fromEntries(product.options.filter((o) => o.values.length === 1).map((o) => [o.code, o.values[0]!.value]));
    return { ...single, ...(color ? { color: color.values[0]!.value } : {}) };
  });
  const [stock, setStock] = useState<Map<string, StockLevel> | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api<StockLevel[]>(`/products/${product.id}/stock`)
        .then((rows) => alive && setStock(new Map(rows.map((r) => [r.variantId, r]))))
        .catch(() => {});
    void load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [product.id]);

  const variant = useMemo(
    () => product.variants.find((v) => product.options.every((o) => v.options[o.code] === selection[o.code])),
    [product, selection],
  );

  const value = useMemo<State>(
    () => ({ product, selection, stock, variant, select: (code, v) => setSelection((s) => ({ ...s, [code]: v })) }),
    [product, selection, stock, variant],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// ---------------------------------------------------------------- Galerie

export function Gallery() {
  const { product, selection } = useProduct();
  const images = useMemo(() => {
    const forColor = product.images.filter((i) => !selection.color || i.color === selection.color);
    return forColor.length ? forColor : product.images;
  }, [product.images, selection.color]);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const square = product.family === "LINEN";

  // Nouveau coloris : retour à la première photo (réinitialisation pendant le rendu)…
  const [shownColor, setShownColor] = useState(selection.color);
  if (shownColor !== selection.color) {
    setShownColor(selection.color);
    setActive(0);
  }
  // … et le défilement mobile suit (synchronisation du DOM uniquement).
  useEffect(() => {
    track.current?.scrollTo({ left: 0 });
  }, [selection.color]);

  const onScroll = () => {
    const el = track.current;
    if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (images.length === 0) return <div className={cn("bg-surface-alt", square ? "aspect-linen" : "aspect-product")} />;

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse">
      <div className="relative flex-1">
        {/* Mobile : balayage natif (scroll-snap), aucun carrousel JS. */}
        <div ref={track} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto md:hidden" aria-label="Photos du produit">
          {images.map((img, i) => (
            <div key={img.url} className={cn("relative w-full shrink-0 snap-center bg-surface-alt", square ? "aspect-linen" : "aspect-product")}>
              <Image src={img.url} alt={img.alt} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </div>
          ))}
        </div>
        {/* Desktop : image principale avec zoom au survol. */}
        <div
          className={cn("relative hidden cursor-zoom-in overflow-hidden bg-surface-alt md:block", square ? "aspect-linen" : "aspect-product")}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
        >
          <Image
            src={images[active]!.url}
            alt={images[active]!.alt}
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-150 ease-out"
            style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
        </div>
        <Modal
          title={product.name}
          description="Vue agrandie"
          trigger={
            <button type="button" className="absolute right-2 bottom-2 inline-flex size-11 items-center justify-center rounded-sm bg-surface text-ink" aria-label="Agrandir la photo">
              <ZoomIn aria-hidden size={20} strokeWidth={1.5} />
            </button>
          }
        >
          <div className="overflow-auto">
            <Image src={images[active]!.url} alt={images[active]!.alt} width={960} height={square ? 960 : 1200} sizes="200vw" className="h-auto w-auto max-w-none md:w-full" />
          </div>
        </Modal>
        {images.length > 1 && (
          <p className="absolute top-2 right-2 bg-surface px-2 text-xs tabular-nums md:hidden" aria-live="polite">
            {active + 1} / {images.length}
          </p>
        )}
      </div>
      {images.length > 1 && (
        <ul className="hidden w-20 flex-col gap-2 md:flex" aria-label="Miniatures">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Photo ${i + 1}`}
                aria-current={i === active}
                className={cn("relative block w-full bg-surface-alt", square ? "aspect-linen" : "aspect-product", i === active ? "outline-1 outline-ink" : "opacity-80 hover:opacity-100")}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Achat

function available(stock: Map<string, StockLevel> | null, variantId?: string) {
  if (!variantId) return null;
  return stock?.get(variantId)?.available ?? null;
}

export function PurchasePanel({ currency, sizeGuide }: { currency: string; sizeGuide: SizeTable }) {
  const { product, selection, select, stock, variant } = useProduct();
  const { add, pending, error } = useCart();
  const [missing, setMissing] = useState(false);
  const [wished, setWished] = useState<string | null>(null);
  const router = useRouter();

  const prices = product.variants.map((v) => v.price);
  // Sans taille choisie : variante la moins chère du coloris sélectionné.
  const shown = variant ?? [...product.variants].filter((v) => !selection.color || v.options.color === selection.color).sort((a, b) => a.price - b.price)[0];
  const price = shown?.price ?? Math.min(...prices);
  const compareAt = shown?.compareAtPrice ?? null;
  const qty = available(stock, variant?.id);
  const soldOut = variant && qty === 0;

  // Une taille est disponible si une variante de ce coloris (s'il est choisi) a du stock.
  const optionAvailable = (code: string, value: string) => {
    const candidates = product.variants.filter(
      (v) => v.options[code] === value && (!selection.color || code === "color" || v.options.color === selection.color),
    );
    if (!stock) return candidates.length > 0;
    return candidates.some((v) => (stock.get(v.id)?.available ?? 0) > 0);
  };

  async function onAdd() {
    if (!variant) {
      setMissing(true);
      return;
    }
    setMissing(false);
    await add(variant.id, 1);
  }

  async function onWishlist() {
    try {
      await api("/me/wishlist", { method: "POST", json: { productId: product.id } });
      setWished("Ajouté à vos favoris.");
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) router.push(`/connexion?next=/p/${product.slug}`);
      else setWished(errorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-normal tracking-title md:text-4xl">{product.name}</h1>
        <Price amount={price} compareAt={compareAt} currency={currency} size="lg" />
        {product.reviews.count > 0 && (
          <a href="#avis" className="text-sm text-ink-muted underline-offset-4 hover:underline">
            {product.reviews.average?.toLocaleString("fr-FR")} / 5 · {product.reviews.count} avis vérifiés
          </a>
        )}
      </div>

      {product.options.map((o) =>
        o.code === "color" ? (
          <ColorSwatches
            key={o.code}
            name={o.code}
            legend={o.name}
            value={selection[o.code]}
            onChange={(v) => select(o.code, v)}
            options={o.values.map((v) => ({ value: v.value, label: v.value, hex: v.hex ?? "#EFEAE2", available: true }))}
          />
        ) : (
          <div key={o.code} className="flex flex-col gap-2">
            <SizeSelector
              name={o.code}
              legend={o.name}
              value={selection[o.code]}
              onChange={(v) => {
                setMissing(false);
                select(o.code, v);
              }}
              options={o.values.map((v) => ({ value: v.value, label: v.value, available: optionAvailable(o.code, v.value) }))}
            />
            <Modal
              title="Guide des tailles"
              description={sizeGuide.title}
              trigger={<button type="button" className="self-start text-sm underline underline-offset-4">Guide des tailles</button>}
            >
              <SizeGuideTable guide={sizeGuide} />
            </Modal>
          </div>
        ),
      )}

      <div className="min-h-6">
        {variant && qty !== null && <StockStatus stock={qty} />}
        {missing && <p className="text-sm text-danger" role="alert">Choisissez une {product.options.find((o) => o.code !== "color")?.name.toLowerCase() ?? "option"}.</p>}
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        {wished && <p className="text-sm text-ink-muted" role="status">{wished}</p>}
      </div>

      {soldOut ? (
        <BackInStockForm variantId={variant.id} />
      ) : (
        // Mobile : bouton fixé en bas d'écran.
        <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-line bg-bg p-4 md:static md:border-0 md:bg-transparent md:p-0">
          <Button fullWidth onClick={() => void onAdd()} disabled={pending}>
            {pending ? "Ajout…" : "Ajouter au panier"}
          </Button>
          <Button variant="secondary" size="icon" onClick={() => void onWishlist()} aria-label="Ajouter aux favoris">
            <Heart aria-hidden size={20} strokeWidth={1.5} />
          </Button>
        </div>
      )}
    </div>
  );
}

function BackInStockForm({ variantId }: { variantId: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | string>("idle");
  if (state === "done") {
    return (
      <Alert tone="success" title="Alerte enregistrée">
        Nous vous écrirons dès le retour en stock.
      </Alert>
    );
  }
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        try {
          await api("/products/alerts", { method: "POST", json: { variantId, email } });
          setState("done");
        } catch (err) {
          setState(errorMessage(err));
        }
      }}
    >
      <p className="text-sm">Cette taille est épuisée. Recevez un e-mail dès son retour.</p>
      <label htmlFor="alert-email" className="sr-only">E-mail</label>
      <Input id="alert-email" type="email" required autoComplete="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit" variant="secondary" disabled={state === "sending"}>
        M&apos;alerter du retour en stock
      </Button>
      {!["idle", "sending"].includes(state) && <p className="text-sm text-danger">{state}</p>}
    </form>
  );
}
