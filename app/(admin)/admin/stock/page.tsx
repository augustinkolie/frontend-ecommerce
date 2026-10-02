"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader, QueryState } from "@/components/admin/page";
import { useToast } from "@/components/admin/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { api, errorMessage } from "@/lib/api/browser";
import { qs, usePagedList, useApiMutation, useDebounced } from "@/lib/admin/hooks";
import type { Movement, StockRow } from "@/lib/admin/types";
import { cn } from "@/lib/cn";

const MOVE_LABEL: Record<string, string> = { IN: "Entrée", SALE: "Vente", RETURN: "Retour", ADJUSTMENT: "Ajustement" };

function Movements() {
  const list = usePagedList<Movement>("/admin/stock/movements", "stock-movements");
  const columns: Column<Movement>[] = [
    { id: "date", header: "Date", sort: (m) => m.createdAt, cell: (m) => new Date(m.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) },
    { id: "type", header: "Type", sort: (m) => m.type, csv: (m) => MOVE_LABEL[m.type], cell: (m) => MOVE_LABEL[m.type] ?? m.type },
    { id: "product", header: "Produit", sort: (m) => m.productName, cell: (m) => <>{m.productName} <span className="text-ink-muted">· {m.variant}</span></> },
    { id: "sku", header: "SKU", sort: (m) => m.sku, cell: (m) => m.sku },
    { id: "qty", header: "Quantité", numeric: true, sort: (m) => m.quantity, cell: (m) => <span className={m.quantity < 0 ? "text-danger" : "text-success"}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</span> },
    { id: "reason", header: "Motif", sort: (m) => m.reason ?? "", cell: (m) => m.reason ?? "—" },
    { id: "author", header: "Auteur", sort: (m) => m.author, cell: (m) => m.author },
  ];
  return (
    <QueryState query={list}>
      {() => (
        <div className="flex flex-col gap-3">
          <DataTable id="movements" rows={list.items} columns={columns} exportName="mouvements-stock" pagination={list.pagination} noun="mouvements" />
        </div>
      )}
    </QueryState>
  );
}

export default function StockPage() {
  const params = useSearchParams();
  const toast = useToast();
  const [tab, setTab] = useState<"levels" | "moves">("levels");
  const [level, setLevel] = useState(params.get("level") ?? "all");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const list = usePagedList<StockRow>(`/admin/stock${qs({ q, level })}`, "stock");
  const adjust = useApiMutation(["/admin/stock", "/admin/stats", "/admin/products"], "Stock mis à jour");
  const [edit, setEdit] = useState<{ row: StockRow; type: "IN" | "RETURN" | "ADJUSTMENT"; quantity: string; reason: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const columns: Column<StockRow>[] = [
    { id: "product", header: "Produit", sort: (r) => r.productName, cell: (r) => <span className="font-medium">{r.productName}</span> },
    { id: "variant", header: "Variante", sort: (r) => r.variant, cell: (r) => r.variant },
    { id: "sku", header: "SKU", sort: (r) => r.sku, cell: (r) => <span className="text-ink-muted">{r.sku}</span> },
    { id: "stock", header: "Stock", numeric: true, sort: (r) => r.stock, cell: (r) => r.stock },
    { id: "reserved", header: "Réservé", numeric: true, sort: (r) => r.reserved, cell: (r) => r.reserved || "—" },
    { id: "available", header: "Disponible", numeric: true, sort: (r) => r.available, cell: (r) => <span className={cn(r.level === "out" && "text-danger", r.level === "low" && "text-warning")}>{r.available}</span> },
    { id: "alert", header: "Seuil", numeric: true, sort: (r) => r.lowStockAlert, cell: (r) => r.lowStockAlert, hidden: true },
    {
      id: "level",
      header: "État",
      sort: (r) => r.level,
      csv: (r) => r.level,
      cell: (r) => (r.level === "out" ? <Badge tone="danger">Rupture</Badge> : r.level === "low" ? <Badge tone="warning">Faible</Badge> : <Badge tone="success">OK</Badge>),
    },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <Button size="admin" variant="ghost" onClick={(e) => { e.stopPropagation(); setEdit({ row: r, type: "IN", quantity: "", reason: "" }); }}>
          Ajuster
        </Button>
      ),
    },
  ];

  async function importCsv(f: File) {
    setImporting(true);
    try {
      const res = await api<{ updated: number; errors: { line: number; message: string }[] }>("/admin/stock/import", { method: "POST", body: await f.text(), headers: { "content-type": "text/csv" } });
      toast.show(`${res.updated} variante(s) mises à jour${res.errors.length ? `, ${res.errors.length} erreur(s) : ${res.errors.slice(0, 3).map((e) => `ligne ${e.line} ${e.message}`).join(" ; ")}` : ""}.`, res.errors.length ? "danger" : "info");
      void list.refetch();
    } catch (err) {
      toast.show(errorMessage(err), "danger");
    } finally {
      setImporting(false);
      if (file.current) file.current.value = "";
    }
  }

  return (
    <>
      <PageHeader
        title="Stock"
        description="Niveaux par variante, seuils d'alerte et mouvements."
        actions={
          <>
            {/* Téléchargement de fichier, pas une page : <a> voulu. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/admin/stock/export" className="inline-flex h-9 items-center rounded-sm border border-ink px-4 text-sm font-medium hover:bg-surface-alt">Exporter CSV</a>
            <Button size="admin" variant="secondary" disabled={importing} onClick={() => file.current?.click()}>{importing ? "Import…" : "Importer CSV"}</Button>
            <input ref={file} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && void importCsv(e.target.files[0])} aria-label="Fichier CSV de stock" />
          </>
        }
      />
      <div role="tablist" className="mb-4 flex gap-4 border-b border-line">
        {(["levels", "moves"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={cn("-mb-px h-10 border-b-2 text-sm font-medium", tab === t ? "border-accent text-ink" : "border-transparent text-ink-muted hover:text-ink")}>
            {t === "levels" ? "Niveaux" : "Mouvements"}
          </button>
        ))}
      </div>
      {tab === "moves" ? (
        <Movements />
      ) : (
        <QueryState query={list}>
          {() => (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-ink-muted">Import : colonnes « sku ; stock ; seuil_alerte » (niveau absolu). L&apos;export fournit le bon format.</p>
              <DataTable
                id="stock"
                rows={list.items}
                pagination={list.pagination}
                noun="variantes"
                columns={columns}
                exportName="stock"
                toolbar={
                  <>
                    <div className="w-56">
                      <label htmlFor="s-q" className="sr-only">Rechercher</label>
                      <Input id="s-q" density="admin" placeholder="Produit ou SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="w-40">
                      <label htmlFor="s-level" className="sr-only">Niveau</label>
                      <Select id="s-level" density="admin" value={level} onChange={(e) => setLevel(e.target.value)}>
                        <option value="all">Tous niveaux</option>
                        <option value="low">Faible ou rupture</option>
                        <option value="out">Rupture</option>
                      </Select>
                    </div>
                  </>
                }
              />
            </div>
          )}
        </QueryState>
      )}

      <Modal
        open={!!edit}
        onOpenChange={(o) => !o && setEdit(null)}
        title="Ajuster le stock"
        description={edit ? `${edit.row.productName} · ${edit.row.variant} — stock actuel ${edit.row.stock}, réservé ${edit.row.reserved}` : undefined}
        footer={
          <>
            <Button size="admin" variant="ghost" onClick={() => setEdit(null)}>Annuler</Button>
            <Button
              size="admin"
              variant="accent"
              disabled={!edit?.quantity}
              onClick={() =>
                edit &&
                adjust.mutate({ path: "/admin/stock/adjust", json: { variantId: edit.row.id, type: edit.type, quantity: Number(edit.quantity), reason: edit.reason } }, { onSuccess: () => setEdit(null) })
              }
            >
              Enregistrer
            </Button>
          </>
        }
      >
        {edit && (
          <div className="flex flex-col gap-4">
            <Field id="m-type" label="Type de mouvement">
              <Select id="m-type" density="admin" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as typeof edit.type })}>
                <option value="IN">Entrée (réception)</option>
                <option value="RETURN">Retour client</option>
                <option value="ADJUSTMENT">Ajustement (inventaire)</option>
              </Select>
            </Field>
            <Field id="m-qty" label={edit.type === "ADJUSTMENT" ? "Nouveau niveau de stock" : "Quantité ajoutée"}>
              <Input id="m-qty" density="admin" inputMode="numeric" value={edit.quantity} onChange={(e) => setEdit({ ...edit, quantity: e.target.value.replace(/\D/g, "") })} />
            </Field>
            <Field id="m-reason" label="Motif"><Input id="m-reason" density="admin" value={edit.reason} onChange={(e) => setEdit({ ...edit, reason: e.target.value })} placeholder="Réception fournisseur, inventaire…" /></Field>
          </div>
        )}
      </Modal>
    </>
  );
}
