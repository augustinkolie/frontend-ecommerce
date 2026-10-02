"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

/** Un seul point ouvert à la fois : chaque point annonce son ouverture, les autres se ferment. */
const OPEN_EVENT = "hero-hotspot:open";

export type HeroHotspotProduct = {
  id: string;
  name: string;
  href: string;
  /** Prix déjà formaté (le formatage se fait côté serveur). */
  price: string;
  imageUrl: string | null;
  imageAlt: string | null;
  x: number;
  y: number;
};

/**
 * Point produit posé sur la photo de la une (desktop uniquement).
 * Bouton de 44 px (cible tactile) autour d'un cercle de 24 px. Au clic, mini-fiche
 * à côté du point : vers la gauche si le point est dans le tiers droit, sinon vers la droite.
 * Fermeture : Échap (le focus revient au point), clic en dehors, second clic sur le point.
 * Masqué s'il tombe sous le bloc de texte (cadrage de la photo variable selon l'écran).
 */
export function HeroHotspot({ product }: { product: HeroHotspotProduct }) {
  const [open, setOpen] = useState(false);
  const [covered, setCovered] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const cardId = useId();
  const toLeft = product.x > 100 * (2 / 3);

  // Le cadrage de la photo varie avec la largeur d'écran : un point qui passe sous le bloc de texte est masqué.
  useEffect(() => {
    const copy = document.querySelector("[data-hero-copy]");
    const layer = root.current?.parentElement;
    if (!copy || !layer) return;
    const measure = () => {
      // Position calculée depuis le cadre de la photo (et non depuis le point, qui mesure 0 une fois masqué).
      const a = layer.getBoundingClientRect();
      const b = copy.getBoundingClientRect();
      const cx = a.left + (a.width * product.x) / 100;
      const cy = a.top + (a.height * product.y) / 100;
      const margin = 16; // le cercle (24 px) doit être entièrement hors du bloc
      setCovered(cx > b.left - margin && cx < b.right + margin && cy > b.top - margin && cy < b.bottom + margin);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(copy);
    ro.observe(layer);
    return () => ro.disconnect();
  }, [product.x, product.y]);

  useEffect(() => {
    const onOtherOpen = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== cardId) setOpen(false);
    };
    window.addEventListener(OPEN_EVENT, onOtherOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOtherOpen);
  }, [cardId]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: cardId }));
  };

  return (
    <div ref={root} hidden={covered} className={cn("absolute -translate-x-1/2 -translate-y-1/2", open ? "z-30" : "z-0")} style={{ left: `${product.x}%`, top: `${product.y}%` }}>
      <button
        ref={button}
        type="button"
        aria-label={`${product.name}, ${product.price}`}
        aria-expanded={open}
        aria-controls={cardId}
        onClick={toggle}
        className="group flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-photo-light"
      >
        <span aria-hidden className={cn("flex size-6 items-center justify-center rounded-full border border-photo-light bg-photo-ink/60 transition-colors duration-150 group-hover:bg-photo-ink/80", open && "bg-photo-ink/80")}>
          <span className="size-1.5 rounded-full bg-photo-light" />
        </span>
      </button>

      <div
        id={cardId}
        role="group"
        aria-label={product.name}
        hidden={!open}
        className={cn(
          "absolute top-1/2 w-72 -translate-y-1/2 rounded border border-line bg-surface p-3 text-ink motion-reduce:animate-none",
          toLeft ? "right-full mr-1 animate-hotspot-in-left" : "left-full ml-1 animate-hotspot-in-right",
        )}
      >
        <div className="flex gap-3">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-surface-alt">
            {product.imageUrl && <Image src={product.imageUrl} alt={product.imageAlt ?? ""} fill sizes="64px" className="object-cover" />}
          </div>
          <div className="flex min-w-0 flex-col justify-center gap-1">
            <p className="text-sm">{product.name}</p>
            <p className="text-sm font-medium tabular-nums">{product.price}</p>
            <Link href={product.href} className="text-sm underline decoration-line decoration-1 underline-offset-4 hover:decoration-ink">
              Voir le produit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
