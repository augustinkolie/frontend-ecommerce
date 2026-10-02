"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/field";
import type { Facet } from "@/lib/api/types";
import { cn } from "@/lib/cn";

const FILTER_KEYS = ["size", "shoe_size", "dimension", "color", "material", "price_min", "price_max", "on_sale"];

function useFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const go = (next: URLSearchParams) => {
    next.delete("cursor");
    next.delete("page");
    const qs = next.toString();
    start(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  return { params, go, pending };
}

function toggle(params: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(params);
  const current = (next.get(key) ?? "").split(",").filter(Boolean);
  const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  if (updated.length) next.set(key, updated.join(","));
  else next.delete(key);
  return next;
}

function FacetGroup({ facet }: { facet: Facet }) {
  const { params, go } = useFilterNavigation();
  const selected = (params.get(facet.code) ?? "").split(",").filter(Boolean);
  const isColor = facet.code === "color";
  const isSize = ["size", "shoe_size", "dimension"].includes(facet.code);

  return (
    <fieldset className="flex flex-col gap-3 border-b border-line pb-6">
      <legend className="mb-3 text-xs font-semibold tracking-caps text-ink-muted uppercase">{facet.label}</legend>
      {isSize ? (
        <div className="flex flex-wrap gap-2">
          {facet.values.map((v) => {
            const on = selected.includes(v.value);
            return (
              <button
                key={v.value}
                type="button"
                aria-pressed={on}
                disabled={v.count === 0 && !on}
                onClick={() => go(toggle(params, facet.code, v.value))}
                className={cn(
                  "inline-flex h-11 min-w-11 items-center justify-center rounded-sm border px-2 text-sm tabular-nums transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-40",
                  on ? "border-ink bg-ink text-on-ink" : "border-line bg-surface hover:border-ink",
                )}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      ) : isColor ? (
        <ul className="grid grid-cols-2 gap-1">
          {facet.values.map((v) => {
            const on = selected.includes(v.value);
            return (
              <li key={v.value}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => go(toggle(params, facet.code, v.value))}
                  className="flex h-11 w-full items-center gap-2 rounded-sm px-1 text-left text-sm hover:bg-surface-alt"
                >
                  <span
                    aria-hidden
                    className={cn("size-6 shrink-0 rounded-full border border-line", on && "ring-2 ring-ink ring-offset-2 ring-offset-bg")}
                    style={{ backgroundColor: v.hex ?? undefined }}
                  />
                  <span className="flex-1 truncate">{v.label}</span>
                  <span className="text-xs text-ink-muted tabular-nums">{v.count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col">
          {facet.values.map((v) => (
            <Checkbox
              key={v.value}
              id={`f-${facet.code}-${v.value}`}
              label={v.label}
              count={v.count}
              checked={selected.includes(v.value)}
              onCheckedChange={() => go(toggle(params, facet.code, v.value))}
            />
          ))}
        </div>
      )}
    </fieldset>
  );
}

function PriceFilter({ currency }: { currency: string }) {
  const { params, go } = useFilterNavigation();
  const [min, setMin] = useState(params.get("price_min") ?? "");
  const [max, setMax] = useState(params.get("price_max") ?? "");
  return (
    <form
      className="flex flex-col gap-3 border-b border-line pb-6"
      onSubmit={(e) => {
        e.preventDefault();
        const next = new URLSearchParams(params);
        for (const [k, v] of [["price_min", min], ["price_max", max]] as const) {
          if (v) next.set(k, String(Math.max(0, Math.round(Number(v)))));
          else next.delete(k);
        }
        go(next);
      }}
    >
      <p className="text-xs font-semibold tracking-caps text-ink-muted uppercase">Prix ({currency})</p>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="price-min">Prix minimum</label>
        <Input id="price-min" density="admin" inputMode="numeric" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} />
        <span aria-hidden className="text-ink-muted">–</span>
        <label className="sr-only" htmlFor="price-max">Prix maximum</label>
        <Input id="price-max" density="admin" inputMode="numeric" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} />
      </div>
      <Button type="submit" variant="secondary" size="admin">Appliquer</Button>
    </form>
  );
}

function OnSaleFilter() {
  const { params, go } = useFilterNavigation();
  return (
    <div className="border-b border-line pb-6">
      <Checkbox
        id="f-on-sale"
        label="Promotions uniquement"
        checked={params.get("on_sale") === "1"}
        onCheckedChange={(v) => {
          const next = new URLSearchParams(params);
          if (v) next.set("on_sale", "1");
          else next.delete("on_sale");
          go(next);
        }}
      />
    </div>
  );
}

export function FilterPanel({ facets, currency }: { facets: Facet[]; currency: string }) {
  return (
    <div className="flex flex-col gap-6">
      {facets.map((f) => (
        <FacetGroup key={f.code} facet={f} />
      ))}
      <PriceFilter currency={currency} />
      <OnSaleFilter />
    </div>
  );
}

/** Filtres actifs sous forme de pastilles retirables. */
export function ActiveFilters() {
  const { params, go } = useFilterNavigation();
  const chips: { key: string; value: string; label: string }[] = [];
  for (const key of FILTER_KEYS) {
    const raw = params.get(key);
    if (!raw) continue;
    if (key === "price_min") chips.push({ key, value: raw, label: `Min ${raw}` });
    else if (key === "price_max") chips.push({ key, value: raw, label: `Max ${raw}` });
    else if (key === "on_sale") chips.push({ key, value: raw, label: "Promotions" });
    else for (const v of raw.split(",")) chips.push({ key, value: v, label: v });
  }
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={`${c.key}:${c.value}`}
          type="button"
          onClick={() => {
            const next = ["price_min", "price_max", "on_sale"].includes(c.key) ? new URLSearchParams(params) : toggle(params, c.key, c.value);
            if (["price_min", "price_max", "on_sale"].includes(c.key)) next.delete(c.key);
            go(next);
          }}
          className="inline-flex h-8 items-center gap-1 rounded-sm border border-line bg-surface px-2 text-sm hover:border-ink"
          aria-label={`Retirer le filtre ${c.label}`}
        >
          {c.label}
          <X aria-hidden size={16} strokeWidth={1.5} />
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          const next = new URLSearchParams(params);
          FILTER_KEYS.forEach((k) => next.delete(k));
          go(next);
        }}
        className="h-8 text-sm underline underline-offset-4"
      >
        Tout effacer
      </button>
    </div>
  );
}

export function MobileFilters({ facets, currency, total }: { facets: Facet[]; currency: string; total: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      side="left"
      title="Filtrer"
      description="Filtres du catalogue"
      trigger={
        <Button variant="secondary" size="admin">
          <SlidersHorizontal aria-hidden size={16} strokeWidth={1.5} />
          Filtrer
        </Button>
      }
      footer={
        <Button fullWidth onClick={() => setOpen(false)}>
          Voir {total} produit{total > 1 ? "s" : ""}
        </Button>
      }
    >
      <FilterPanel facets={facets} currency={currency} />
    </Drawer>
  );
}

export function SortSelect() {
  const { params, go, pending } = useFilterNavigation();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="sr-only">Trier par</label>
      <Select
        id="sort"
        density="admin"
        value={params.get("sort") ?? "new"}
        disabled={pending}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value === "new") next.delete("sort");
          else next.set("sort", e.target.value);
          go(next);
        }}
      >
        <option value="new">Nouveautés</option>
        <option value="best">Meilleures ventes</option>
        <option value="price_asc">Prix croissant</option>
        <option value="price_desc">Prix décroissant</option>
      </Select>
    </div>
  );
}
