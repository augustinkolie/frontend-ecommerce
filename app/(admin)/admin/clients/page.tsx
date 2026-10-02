"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader, QueryState } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { qs, usePagedList, useDebounced } from "@/lib/admin/hooks";
import type { CustomerRow } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [blocked, setBlocked] = useState(false);
  const q = useDebounced(search);
  const list = usePagedList<CustomerRow>(`/admin/customers${qs({ q, blocked: blocked ? "1" : undefined })}`, "clients");

  const columns: Column<CustomerRow>[] = [
    { id: "name", header: "Client", sort: (c) => c.name ?? c.email, cell: (c) => <span className="font-medium">{c.name ?? "—"}</span> },
    { id: "email", header: "E-mail", sort: (c) => c.email, cell: (c) => c.email },
    { id: "phone", header: "Téléphone", sort: (c) => c.phone ?? "", cell: (c) => c.phone ?? "—", hidden: true },
    { id: "orders", header: "Commandes", numeric: true, sort: (c) => c.orderCount, cell: (c) => c.orderCount },
    { id: "spent", header: "Total dépensé", numeric: true, sort: (c) => c.totalSpent, cell: (c) => formatPrice(c.totalSpent) },
    { id: "since", header: "Inscrit le", sort: (c) => c.createdAt, cell: (c) => new Date(c.createdAt).toLocaleDateString("fr-FR") },
    { id: "state", header: "État", sort: (c) => (c.blocked ? 1 : 0), csv: (c) => (c.blocked ? "bloqué" : "actif"), cell: (c) => (c.blocked ? <Badge tone="danger">Bloqué</Badge> : null) },
  ];

  return (
    <>
      <PageHeader title="Clients" description={list.total !== undefined ? `${list.total} client(s)` : undefined} />
      <QueryState query={list}>
        {() => (
          <div className="flex flex-col gap-3">
            <DataTable
              id="customers"
              rows={list.items}
              pagination={list.pagination}
              noun="clients"
              columns={columns}
              exportName="clients"
              onRowClick={(c) => router.push(`/admin/clients/${c.id}`)}
              toolbar={
                <>
                  <div className="w-64">
                    <label htmlFor="c-q" className="sr-only">Rechercher</label>
                    <Input id="c-q" density="admin" placeholder="Nom, e-mail, téléphone…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <label className="flex h-9 items-center gap-2 text-sm">
                    <input type="checkbox" className="size-4 accent-accent" checked={blocked} onChange={(e) => setBlocked(e.target.checked)} />
                    Bloqués uniquement
                  </label>
                </>
              }
            />
          </div>
        )}
      </QueryState>
    </>
  );
}
