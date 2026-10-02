"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader, QueryState } from "@/components/admin/page";
import { SavedFilters } from "@/components/admin/saved-filters";
import { OrderStatusBadge, ORDER_STATUSES } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { qs, useApi, usePagedList, useApiMutation, useDebounced } from "@/lib/admin/hooks";
import type { AdminOrderRow } from "@/lib/admin/types";
import type { PublicSettings } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "À payer", PAID: "Payée", PREPARING: "En préparation", SHIPPED: "Expédiée", DELIVERED: "Livrée", CANCELLED: "Annulée", REFUNDED: "Remboursée",
};

const KEYS = ["q", "status", "payment", "zone", "from", "to"] as const;

export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [filters, setFilters] = useState<Record<string, string>>(() => Object.fromEntries(KEYS.map((k) => [k, params.get(k) ?? ""])));
  const q = useDebounced(filters.q ?? "");
  const query = { ...filters, q };

  // Filtres conservés dans l'URL (partageables).
  useEffect(() => {
    router.replace(`${pathname}${qs(query)}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(query)]);

  const settings = useApi<PublicSettings>("/settings");
  const list = usePagedList<AdminOrderRow>(`/admin/orders${qs({ ...query })}`, "commandes");
  const status = useApiMutation(["/admin/orders", "/admin/stats"], "Statuts mis à jour");
  const set = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));

  const columns: Column<AdminOrderRow>[] = [
    { id: "number", header: "N°", cell: (o) => <span className="font-medium">#{o.number}</span>, sort: (o) => o.number, numeric: true },
    { id: "date", header: "Date", cell: (o) => new Date(o.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }), sort: (o) => o.createdAt },
    { id: "customer", header: "Client", cell: (o) => o.customer, sort: (o) => o.customer },
    { id: "email", header: "E-mail", cell: (o) => o.email, sort: (o) => o.email, hidden: true },
    { id: "status", header: "Statut", cell: (o) => <OrderStatusBadge status={o.status} />, sort: (o) => o.status, csv: (o) => STATUS_LABEL[o.status] },
    { id: "payment", header: "Paiement", cell: (o) => settings.data?.paymentMethods.find((m) => m.code === o.paymentMethod)?.label ?? o.paymentMethod, sort: (o) => o.paymentMethod },
    { id: "shipping", header: "Livraison", cell: (o) => o.shippingMethod, sort: (o) => o.shippingMethod, hidden: true },
    { id: "items", header: "Art.", cell: (o) => o.itemCount, sort: (o) => o.itemCount, numeric: true },
    { id: "total", header: "Total", cell: (o) => formatPrice(o.total, o.currency), sort: (o) => o.total, numeric: true },
  ];

  const bulk = (selected: AdminOrderRow[], clear: () => void, to: "PREPARING" | "SHIPPED") =>
    Promise.all(selected.map((o) => status.mutateAsync({ path: `/admin/orders/${o.id}/status`, json: { status: to, notify: true } }))).finally(clear);

  return (
    <>
      <PageHeader
        title="Commandes"
        description={list.total !== undefined ? `${list.total} commande(s)` : undefined}
        actions={
          <>
          <Link href="/admin/commandes/retours" className="inline-flex h-9 items-center rounded-sm px-3 text-sm underline">Retours</Link>
          <a href={`/api/admin/orders/export${qs(query)}`} className="inline-flex h-9 items-center rounded-sm border border-ink px-4 text-sm font-medium hover:bg-surface-alt">
            Exporter tout (CSV)
          </a>
          </>
        }
      />
      <QueryState query={list}>
        {() => (
          <div className="flex flex-col gap-3">
            <DataTable
              id="orders"
              rows={list.items}
              pagination={list.pagination}
              noun="commandes"
              columns={columns}
              exportName="commandes"
              onRowClick={(o) => router.push(`/admin/commandes/${o.id}`)}
              bulkActions={(selected, clear) => (
                <>
                  <Button size="admin" variant="ghost" onClick={() => void bulk(selected, clear, "PREPARING")}>En préparation</Button>
                  <Button size="admin" variant="ghost" onClick={() => void bulk(selected, clear, "SHIPPED")}>Expédiée</Button>
                </>
              )}
              toolbar={
                <>
                  <div className="w-56">
                    <label htmlFor="o-q" className="sr-only">Rechercher</label>
                    <Input id="o-q" density="admin" placeholder="N°, e-mail, client…" value={filters.q} onChange={(e) => set("q", e.target.value)} />
                  </div>
                  <div className="w-40">
                    <label htmlFor="o-status" className="sr-only">Statut</label>
                    <Select id="o-status" density="admin" value={filters.status} onChange={(e) => set("status", e.target.value)}>
                      <option value="">Tous les statuts</option>
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </Select>
                  </div>
                  <div className="w-44">
                    <label htmlFor="o-pay" className="sr-only">Paiement</label>
                    <Select id="o-pay" density="admin" value={filters.payment} onChange={(e) => set("payment", e.target.value)}>
                      <option value="">Tous les paiements</option>
                      {["cash_on_delivery", "test_card", "orange_money", "mtn_momo"].map((c) => (
                        <option key={c} value={c}>{settings.data?.paymentMethods.find((m) => m.code === c)?.label ?? c}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="w-48">
                    <label htmlFor="o-zone" className="sr-only">Zone</label>
                    <Select id="o-zone" density="admin" value={filters.zone} onChange={(e) => set("zone", e.target.value)}>
                      <option value="">Toutes les zones</option>
                      {settings.data?.shippingZones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </Select>
                  </div>
                  <label className="flex items-center gap-1 text-xs text-ink-muted">
                    Du <Input density="admin" type="date" value={filters.from} onChange={(e) => set("from", e.target.value)} className="w-36" />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-ink-muted">
                    au <Input density="admin" type="date" value={filters.to} onChange={(e) => set("to", e.target.value)} className="w-36" />
                  </label>
                  <SavedFilters id="orders" current={filters} onApply={(v) => setFilters({ ...Object.fromEntries(KEYS.map((k) => [k, ""])), ...v })} />
                </>
              }
            />
          </div>
        )}
      </QueryState>
    </>
  );
}
