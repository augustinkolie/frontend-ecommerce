"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/admin/confirm";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader, QueryState } from "@/components/admin/page";
import { SavedFilters } from "@/components/admin/saved-filters";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { qs, useApi, usePagedList, useApiMutation, useDebounced } from "@/lib/admin/hooks";
import { FAMILY, PRODUCT_STATUS as STATUS } from "@/lib/admin/labels";
import type { AdminCategory, AdminProductRow } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";


export default function ProductsPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [filters, setFilters] = useState<Record<string, string>>({ q: "", status: "", family: "", categoryId: "", lowStock: "" });
  const q = useDebounced(filters.q ?? "");
  const list = usePagedList<AdminProductRow>(`/admin/products${qs({ ...filters, q })}`, "produits");
  const categories = useApi<AdminCategory[]>("/admin/categories");
  const bulk = useApiMutation(["/admin/products"], "Produits mis à jour");
  const set = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));

  const columns: Column<AdminProductRow>[] = [
    {
      id: "name",
      header: "Produit",
      sort: (p) => p.name,
      cell: (p) => (
        <span className="flex items-center gap-3">
          <span className="relative size-8 shrink-0 overflow-hidden rounded-sm bg-surface-alt">{p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="32px" className="object-cover" />}</span>
          <span className="font-medium">{p.name}</span>
        </span>
      ),
    },
    { id: "status", header: "Statut", sort: (p) => p.status, csv: (p) => STATUS[p.status].label, cell: (p) => <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge> },
    { id: "family", header: "Famille", sort: (p) => p.family, csv: (p) => FAMILY[p.family], cell: (p) => FAMILY[p.family] },
    { id: "category", header: "Catégorie", sort: (p) => p.category, cell: (p) => p.category },
    { id: "variants", header: "Variantes", sort: (p) => p.variantCount, numeric: true, cell: (p) => p.variantCount },
    { id: "stock", header: "Stock", sort: (p) => p.stock, numeric: true, cell: (p) => <span className={p.lowStock ? "text-warning" : ""}>{p.stock}</span> },
    { id: "price", header: "Prix", sort: (p) => p.priceMin, numeric: true, cell: (p) => (p.priceMin === p.priceMax ? formatPrice(p.priceMin) : `${formatPrice(p.priceMin)} – ${formatPrice(p.priceMax)}`) },
    { id: "updated", header: "Modifié", sort: (p) => p.updatedAt, hidden: true, cell: (p) => new Date(p.updatedAt).toLocaleDateString("fr-FR") },
  ];

  const run = async (ids: string[], action: "publish" | "draft" | "archive" | "delete", clear: () => void) => {
    if (action === "delete" && !(await confirm({ title: "Supprimer les produits", message: `${ids.length} produit(s) seront retirés de la boutique (suppression logique, historique conservé).`, confirmLabel: "Supprimer", danger: true }))) return;
    bulk.mutate({ path: "/admin/products/bulk", json: { ids, action } }, { onSuccess: clear });
  };

  return (
    <>
      <PageHeader
        title="Produits"
        description={list.total !== undefined ? `${list.total} produit(s)` : undefined}
        actions={<Link href="/admin/produits/nouveau" className={buttonClasses({ size: "admin", variant: "accent" })}>Nouveau produit</Link>}
      />
      <QueryState query={list}>
        {() => (
          <div className="flex flex-col gap-3">
            <DataTable
              id="products"
              rows={list.items}
              pagination={list.pagination}
              noun="produits"
              columns={columns}
              exportName="produits"
              onRowClick={(p) => router.push(`/admin/produits/${p.id}`)}
              bulkActions={(sel, clear) => (
                <>
                  <Button size="admin" variant="ghost" onClick={() => void run(sel.map((s) => s.id), "publish", clear)}>Publier</Button>
                  <Button size="admin" variant="ghost" onClick={() => void run(sel.map((s) => s.id), "draft", clear)}>Brouillon</Button>
                  <Button size="admin" variant="ghost" onClick={() => void run(sel.map((s) => s.id), "archive", clear)}>Archiver</Button>
                  <Button size="admin" variant="ghost" onClick={() => void run(sel.map((s) => s.id), "delete", clear)}>Supprimer</Button>
                </>
              )}
              toolbar={
                <>
                  <div className="w-56">
                    <label htmlFor="p-q" className="sr-only">Rechercher</label>
                    <Input id="p-q" density="admin" placeholder="Nom, slug ou SKU…" value={filters.q} onChange={(e) => set("q", e.target.value)} />
                  </div>
                  <div className="w-36">
                    <label htmlFor="p-status" className="sr-only">Statut</label>
                    <Select id="p-status" density="admin" value={filters.status} onChange={(e) => set("status", e.target.value)}>
                      <option value="">Tous statuts</option>
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </Select>
                  </div>
                  <div className="w-40">
                    <label htmlFor="p-family" className="sr-only">Famille</label>
                    <Select id="p-family" density="admin" value={filters.family} onChange={(e) => set("family", e.target.value)}>
                      <option value="">Toutes familles</option>
                      {Object.entries(FAMILY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </Select>
                  </div>
                  <div className="w-44">
                    <label htmlFor="p-cat" className="sr-only">Catégorie</label>
                    <Select id="p-cat" density="admin" value={filters.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                      <option value="">Toutes catégories</option>
                      {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.parentId ? "— " : ""}{c.name}</option>)}
                    </Select>
                  </div>
                  <label className="flex h-9 items-center gap-2 text-sm">
                    <input type="checkbox" className="size-4 accent-accent" checked={filters.lowStock === "1"} onChange={(e) => set("lowStock", e.target.checked ? "1" : "")} />
                    Stock faible
                  </label>
                  <SavedFilters id="products" current={filters} onApply={(v) => setFilters((f) => ({ ...Object.fromEntries(Object.keys(f).map((k) => [k, ""])), ...v }))} />
                </>
              }
            />
          </div>
        )}
      </QueryState>
    </>
  );
}
