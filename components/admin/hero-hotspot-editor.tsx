"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useApi, useDebounced } from "@/lib/admin/hooks";
import type { AdminProductRow, HeroHotspotDraft } from "@/lib/admin/types";
import type { Page } from "@/lib/api/types";
import { cn } from "@/lib/cn";

const MAX = 4;
const round = (n: number) => Math.round(Math.min(100, Math.max(0, n)) * 10) / 10;

/**
 * Produits visibles sur la photo de la une : ajout (recherche), placement d'un point
 * en cliquant sur l'aperçu, ajustement fin au clavier (champs X / Y en %), retrait.
 *
 * L'aperçu reprend le cadrage desktop (environ 16:9, photo recadrée au centre) et
 * signale la zone couverte par le bloc de texte : un point placé dessous ne sera pas visible.
 */
export function HeroHotspotEditor({ imageUrl, value, onChange }: { imageUrl: string; value: HeroHotspotDraft[]; onChange: (v: HeroHotspotDraft[]) => void }) {
  const [placing, setPlacing] = useState<string | null>(value[0]?.productId ?? null);
  const [search, setSearch] = useState("");
  const q = useDebounced(search.trim());
  const results = useApi<Page<AdminProductRow>>(q.length >= 2 ? `/admin/products?q=${encodeURIComponent(q)}&status=PUBLISHED&limit=8` : null);

  const update = (productId: string, patch: Partial<HeroHotspotDraft>) => onChange(value.map((h) => (h.productId === productId ? { ...h, ...patch } : h)));
  const add = (p: AdminProductRow) => {
    if (value.length >= MAX || value.some((h) => h.productId === p.id)) return;
    onChange([...value, { productId: p.id, name: p.name, imageUrl: p.imageUrl, x: 70, y: 40 }]);
    setPlacing(p.id);
    setSearch("");
  };
  const remove = (productId: string) => {
    onChange(value.filter((h) => h.productId !== productId));
    if (placing === productId) setPlacing(null);
  };
  const inTextZone = (h: HeroHotspotDraft) => h.x < 42 && h.y > 42;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium">Produits sur la photo</span>
        <span className="text-xs text-ink-muted tabular-nums">{value.length} / {MAX} · 2 à 4 conseillés</span>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-sm bg-surface-alt">
        <Image src={imageUrl} alt="" fill sizes="800px" className="object-cover" />
        {/* Clic sur l'aperçu : place le point du produit sélectionné. */}
        <button
          type="button"
          aria-label={placing ? "Placer le point ici" : "Sélectionnez d'abord un produit à placer"}
          disabled={!placing}
          className={cn("absolute inset-0", placing ? "cursor-crosshair" : "cursor-default")}
          onClick={(e) => {
            if (!placing) return;
            const r = e.currentTarget.getBoundingClientRect();
            update(placing, { x: round(((e.clientX - r.left) / r.width) * 100), y: round(((e.clientY - r.top) / r.height) * 100) });
          }}
        />
        {/* Zone approximative du bloc de texte de la boutique (bas gauche). */}
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 flex h-7/12 w-5/12 items-end border border-dashed border-photo-light p-2">
          <span className="rounded-sm bg-photo-ink px-1 text-xs text-photo-light">Zone du texte</span>
        </div>
        {value.map((h, i) => (
          <span
            key={h.productId}
            aria-hidden
            className={cn(
              "pointer-events-none absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-photo-light text-xs font-semibold text-photo-light",
              placing === h.productId ? "bg-accent" : "bg-photo-ink/70",
            )}
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <p className="text-xs text-ink-muted">Sélectionnez un produit puis cliquez sur la photo à l&apos;endroit où il apparaît. Les champs X / Y permettent un réglage fin.</p>

      {value.length > 0 && (
        <ul className="flex flex-col">
          {value.map((h, i) => (
            <li key={h.productId} className={cn("flex flex-wrap items-center gap-3 border-b border-line py-2 last:border-b-0", placing === h.productId && "bg-surface-alt")}>
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-on-ink">{i + 1}</span>
              <span className="relative h-10 w-8 shrink-0 overflow-hidden rounded-sm bg-surface-alt">{h.imageUrl && <Image src={h.imageUrl} alt="" fill sizes="32px" className="object-cover" />}</span>
              <span className="min-w-40 flex-1 text-sm">
                {h.name}
                {inTextZone(h) && <span className="block text-xs text-warning">Sous le bloc de texte : non visible sur desktop</span>}
              </span>
              <label className="flex items-center gap-1 text-xs text-ink-muted">
                X
                <span className="w-16"><Input density="admin" inputMode="decimal" aria-label={`Position horizontale de ${h.name}, en %`} value={h.x} onChange={(e) => update(h.productId, { x: round(Number(e.target.value) || 0) })} /></span>
              </label>
              <label className="flex items-center gap-1 text-xs text-ink-muted">
                Y
                <span className="w-16"><Input density="admin" inputMode="decimal" aria-label={`Position verticale de ${h.name}, en %`} value={h.y} onChange={(e) => update(h.productId, { y: round(Number(e.target.value) || 0) })} /></span>
              </label>
              <Button size="admin" variant={placing === h.productId ? "accent" : "secondary"} aria-pressed={placing === h.productId} onClick={() => setPlacing(h.productId)}>
                {placing === h.productId ? "En placement" : "Placer"}
              </Button>
              <Button size="admin" variant="ghost" onClick={() => remove(h.productId)}>Retirer</Button>
            </li>
          ))}
        </ul>
      )}

      {value.length < MAX && (
        <div className="flex flex-col gap-2">
          <label htmlFor="hs-search" className="text-sm">Ajouter un produit</label>
          <Input id="hs-search" density="admin" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom ou référence (2 caractères min.)" autoComplete="off" />
          {results.data && q.length >= 2 && (
            <ul className="flex flex-col rounded-sm border border-line">
              {results.data.items.length === 0 && <li className="px-3 py-2 text-sm text-ink-muted">Aucun produit publié.</li>}
              {results.data.items.map((p) => {
                const taken = value.some((h) => h.productId === p.id);
                return (
                  <li key={p.id} className="flex items-center gap-3 border-b border-line px-3 py-1 last:border-b-0">
                    <span className="relative h-10 w-8 shrink-0 overflow-hidden rounded-sm bg-surface-alt">{p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="32px" className="object-cover" />}</span>
                    <span className="flex-1 text-sm">{p.name}</span>
                    <Button size="admin" variant="secondary" disabled={taken} onClick={() => add(p)}>{taken ? "Déjà sur la photo" : "Ajouter"}</Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
