"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import type { AdminVariant, AttributeType } from "@/lib/admin/types";
import type { Family } from "@/lib/api/types";
import { cn } from "@/lib/cn";

const clean = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/×/g, "X").replace(/[^A-Za-z0-9]+/g, "").toUpperCase();

/** Produit cartésien des valeurs choisies (taille × couleur…). */
function combinations(groups: string[][]): string[][] {
  return groups.reduce<string[][]>((acc, g) => acc.flatMap((a) => g.map((v) => [...a, v])), [[]]);
}

/**
 * Matrice de variantes : on coche les valeurs par attribut, la matrice est générée
 * automatiquement ; prix, prix barré, stock et seuil sont éditables en ligne.
 */
export function VariantMatrix({
  family,
  attributes,
  variants,
  onChange,
  skuPrefix,
  defaultPrice,
}: {
  family: Family;
  attributes: AttributeType[];
  variants: AdminVariant[];
  onChange: (v: AdminVariant[]) => void;
  skuPrefix: string;
  defaultPrice: number;
}) {
  const types = useMemo(() => attributes.filter((t) => t.families.includes(family)).sort((a, b) => a.position - b.position), [attributes, family]);
  const valueById = useMemo(() => new Map(attributes.flatMap((t) => t.values.map((v) => [v.id, { ...v, type: t }]))), [attributes]);

  // Valeurs cochées = valeurs présentes dans les variantes existantes.
  const [chosen, setChosen] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const v of variants) for (const id of v.attributeValueIds) {
      const t = valueById.get(id)?.type;
      if (t) init[t.id] = [...new Set([...(init[t.id] ?? []), id])];
    }
    return init;
  });
  const [bulk, setBulk] = useState({ price: "", compareAtPrice: "", stock: "" });

  const toggle = (typeId: string, valueId: string) => setChosen((c) => ({ ...c, [typeId]: (c[typeId] ?? []).includes(valueId) ? (c[typeId] ?? []).filter((x) => x !== valueId) : [...(c[typeId] ?? []), valueId] }));

  const label = (v: AdminVariant) =>
    v.attributeValueIds
      .map((id) => valueById.get(id))
      .filter(Boolean)
      .sort((a, b) => a!.type.position - b!.type.position)
      .map((x) => x!.value)
      .join(" · ");

  function generate() {
    const groups = types.map((t) => (chosen[t.id] ?? []).sort((a, b) => (valueById.get(a)?.position ?? 0) - (valueById.get(b)?.position ?? 0))).filter((g) => g.length > 0);
    if (groups.length === 0) return;
    const key = (ids: string[]) => [...ids].sort().join("|");
    const existing = new Map(variants.map((v) => [key(v.attributeValueIds), v]));
    const next = combinations(groups).map((ids) => {
      const found = existing.get(key(ids));
      if (found) return found;
      const suffix = ids.map((id) => clean(valueById.get(id)?.value ?? "").slice(0, 4)).join("-");
      return { sku: `${clean(skuPrefix).slice(0, 8) || "SKU"}-${suffix}`, price: defaultPrice, compareAtPrice: null, stock: 0, lowStockAlert: 3, weightGrams: null, attributeValueIds: ids } satisfies AdminVariant;
    });
    onChange(next);
  }

  const update = (i: number, patch: Partial<AdminVariant>) => onChange(variants.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const num = (s: string) => (s === "" ? null : Math.max(0, Math.round(Number(s.replace(/\s/g, "")))));

  return (
    <div className="flex flex-col gap-4">
      {types.length === 0 && <p className="text-ink-muted">Aucun attribut de variante pour cette famille (voir Attributs).</p>}
      {types.map((t) => (
        <fieldset key={t.id} className="flex flex-col gap-2">
          <legend className="mb-2 text-xs font-semibold tracking-caps text-ink-muted uppercase">{t.name}</legend>
          <div className="flex flex-wrap gap-1">
            {t.values.map((v) => {
              const on = (chosen[t.id] ?? []).includes(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(t.id, v.id)}
                  className={cn("inline-flex h-8 items-center gap-2 rounded-sm border px-2 text-sm", on ? "border-accent bg-accent text-on-ink" : "border-line bg-surface hover:border-ink-muted")}
                >
                  {v.hex && <span aria-hidden className="size-3 rounded-full border border-line" style={{ backgroundColor: v.hex }} />}
                  {v.value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <div>
        <Button type="button" size="admin" variant="secondary" onClick={generate}>
          Générer la matrice ({types.map((t) => (chosen[t.id] ?? []).length || 0).filter(Boolean).reduce((a, b) => a * b, 1)} variantes)
        </Button>
      </div>

      {variants.length > 0 && (
        <>
          <div className="flex flex-wrap items-end gap-2 rounded-sm border border-line bg-surface-alt p-2">
            <span className="self-center text-xs text-ink-muted">Appliquer à toutes :</span>
            {(["price", "compareAtPrice", "stock"] as const).map((k) => (
              <label key={k} className="flex items-center gap-1 text-xs">
                {k === "price" ? "Prix" : k === "compareAtPrice" ? "Prix barré" : "Stock"}
                <Input density="admin" inputMode="numeric" className="w-28" value={bulk[k]} onChange={(e) => setBulk((b) => ({ ...b, [k]: e.target.value }))} />
              </label>
            ))}
            <Button
              type="button"
              size="admin"
              variant="ghost"
              onClick={() => {
                onChange(
                  variants.map((v) => ({
                    ...v,
                    ...(bulk.price !== "" ? { price: num(bulk.price) ?? v.price } : {}),
                    ...(bulk.compareAtPrice !== "" ? { compareAtPrice: num(bulk.compareAtPrice) } : {}),
                    ...(bulk.stock !== "" ? { stock: num(bulk.stock) ?? v.stock } : {}),
                  })),
                );
                setBulk({ price: "", compareAtPrice: "", stock: "" });
              }}
            >
              Appliquer
            </Button>
          </div>
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-alt text-left text-xs text-ink-muted uppercase">
                  <th className="h-10 px-2 font-semibold">Variante</th>
                  <th className="px-2 font-semibold">SKU</th>
                  <th className="px-2 text-right font-semibold">Prix</th>
                  <th className="px-2 text-right font-semibold">Prix barré</th>
                  <th className="px-2 text-right font-semibold">Stock</th>
                  <th className="px-2 text-right font-semibold">Alerte</th>
                  <th className="px-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr key={v.id ?? v.attributeValueIds.join("|")} className="h-10 border-t border-line">
                    <td className="px-2 whitespace-nowrap">{label(v)}</td>
                    <td className="px-2"><Input density="admin" aria-label={`SKU ${label(v)}`} className="w-40" value={v.sku} onChange={(e) => update(i, { sku: e.target.value.toUpperCase() })} /></td>
                    <td className="px-2"><Input density="admin" aria-label={`Prix ${label(v)}`} inputMode="numeric" className="w-28 text-right tabular-nums" value={v.price} onChange={(e) => update(i, { price: num(e.target.value) ?? 0 })} /></td>
                    <td className="px-2"><Input density="admin" aria-label={`Prix barré ${label(v)}`} inputMode="numeric" className="w-28 text-right tabular-nums" value={v.compareAtPrice ?? ""} onChange={(e) => update(i, { compareAtPrice: num(e.target.value) })} /></td>
                    <td className="px-2"><Input density="admin" aria-label={`Stock ${label(v)}`} inputMode="numeric" className="w-20 text-right tabular-nums" value={v.stock} onChange={(e) => update(i, { stock: num(e.target.value) ?? 0 })} /></td>
                    <td className="px-2"><Input density="admin" aria-label={`Seuil d'alerte ${label(v)}`} inputMode="numeric" className="w-16 text-right tabular-nums" value={v.lowStockAlert} onChange={(e) => update(i, { lowStockAlert: num(e.target.value) ?? 0 })} /></td>
                    <td className="px-2 text-right">
                      <button type="button" className="text-xs text-ink-muted underline hover:text-danger" onClick={() => onChange(variants.filter((_, j) => j !== i))}>Retirer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {variants.some((v) => (v.stockReserved ?? 0) > 0) && <p className="text-xs text-ink-muted">Certaines variantes ont du stock réservé par des paiements en cours.</p>}
        </>
      )}
    </div>
  );
}
