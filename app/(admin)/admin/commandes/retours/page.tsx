"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyBlock, PageHeader, QueryState } from "@/components/admin/page";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { qs, useApi, useApiMutation, useLocalPage } from "@/lib/admin/hooks";
import type { AdminReturn } from "@/lib/admin/types";

const STATUS: Record<AdminReturn["status"], { label: string; tone: BadgeTone }> = {
  REQUESTED: { label: "Demandé", tone: "warning" },
  ACCEPTED: { label: "Accepté", tone: "focus" },
  REFUSED: { label: "Refusé", tone: "danger" },
  RECEIVED: { label: "Reçu (remis en stock)", tone: "ink" },
  REFUNDED: { label: "Remboursé", tone: "success" },
};

export default function ReturnsAdminPage() {
  const [status, setStatus] = useState("");
  const query = useApi<AdminReturn[]>(`/admin/returns${qs({ status })}`);
  const update = useApiMutation(["/admin/returns", "/admin/stock"], "Retour mis à jour");
  const paged = useLocalPage(query.data ?? [], "retours");

  return (
    <>
      <PageHeader
        title="Retours"
        back={{ href: "/admin/commandes", label: "Commandes" }}
        description="Passer un retour à « Reçu » remet les articles en stock. Le remboursement se fait depuis la commande."
        actions={
          <div className="w-44">
            <label htmlFor="r-status" className="sr-only">Statut</label>
            <Select id="r-status" density="admin" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Tous</option>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </div>
        }
      />
      <QueryState query={query}>
        {(rows) =>
          rows.length === 0 ? (
            <EmptyBlock title="Aucun retour" />
          ) : (
            <ul className="flex flex-col gap-3">
              {paged.items.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 rounded border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/admin/commandes/${r.order.id}`} className="font-medium hover:underline">Commande #{r.order.number}</Link>
                    <span className="text-ink-muted">{r.user.name ?? r.user.email} · {new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
                    <span className="ml-auto"><Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge></span>
                  </div>
                  <p>{r.reason}</p>
                  <ul className="text-ink-muted">
                    {r.items.map((i) => {
                      const line = r.order.items.find((l) => l.id === i.orderItemId);
                      return <li key={i.orderItemId}>{line?.name ?? i.orderItemId} ({line?.sku}) × {i.quantity}</li>;
                    })}
                  </ul>
                  <div className="w-56">
                    <label htmlFor={`rs-${r.id}`} className="sr-only">Changer le statut</label>
                    <Select id={`rs-${r.id}`} density="admin" value={r.status} onChange={(e) => update.mutate({ path: `/admin/returns/${r.id}`, method: "PATCH", json: { status: e.target.value } })}>
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </Select>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </QueryState>
      {paged.pagination.total > 0 && <Pagination density="admin" noun="retours" className="mt-3" {...paged.pagination} />}
    </>
  );
}
