"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useConfirm } from "@/components/admin/confirm";
import { PageHeader, Panel, QueryState } from "@/components/admin/page";
import { Badge, OrderStatusBadge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { useApi, useApiMutation, useUnsavedGuard, useLocalPage } from "@/lib/admin/hooks";
import type { Address, OrderStatus } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";

type Customer = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  notes: string | null;
  blockedAt: string | null;
  createdAt: string;
  totalSpent: number;
  paidOrders: number;
  addresses: Address[];
  orders: { id: string; number: number; status: OrderStatus; total: number; currency: string; createdAt: string }[];
  reviews: { id: string; rating: number; text: string; status: string; product: { name: string } }[];
};

function Notes({ customer }: { customer: Customer }) {
  const [notes, setNotes] = useState(customer.notes ?? "");
  const [prev, setPrev] = useState(customer.notes);
  if (prev !== customer.notes) {
    setPrev(customer.notes);
    setNotes(customer.notes ?? "");
  }
  const save = useApiMutation([`/admin/customers`], "Notes enregistrées");
  const dirty = notes !== (customer.notes ?? "");
  useUnsavedGuard(dirty);
  return (
    <Panel title="Notes internes">
      <label htmlFor="notes" className="sr-only">Notes internes</label>
      <Textarea id="notes" className="text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Préférences, incidents, informations utiles…" />
      <div className="mt-2 flex items-center justify-end gap-2">
        {dirty && <span className="mr-auto text-xs text-warning">Non enregistré</span>}
        <Button size="admin" variant="secondary" disabled={!dirty} onClick={() => save.mutate({ path: `/admin/customers/${customer.id}`, method: "PATCH", json: { notes } })}>Enregistrer</Button>
      </div>
    </Panel>
  );
}

export default function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useApi<Customer>(`/admin/customers/${id}`);
  const orders = useLocalPage(query.data?.orders ?? [], "client-orders");
  const block = useApiMutation(["/admin/customers"], "Client mis à jour");
  const confirm = useConfirm();

  return (
    <QueryState query={query}>
      {(c) => (
        <>
          <PageHeader
            title={c.name ?? c.email}
            back={{ href: "/admin/clients", label: "Clients" }}
            description={<>{c.email}{c.phone ? ` · ${c.phone}` : ""} · client depuis le {new Date(c.createdAt).toLocaleDateString("fr-FR")} {c.blockedAt && <Badge tone="danger">Bloqué</Badge>}</>}
            actions={
              <Button
                size="admin"
                variant={c.blockedAt ? "secondary" : "danger"}
                onClick={async () => {
                  const blocking = !c.blockedAt;
                  if (blocking && !(await confirm({ title: "Bloquer le client", message: "Le client sera déconnecté et ne pourra plus se connecter.", confirmLabel: "Bloquer", danger: true }))) return;
                  block.mutate({ path: `/admin/customers/${c.id}`, method: "PATCH", json: { blocked: blocking } });
                }}
              >
                {c.blockedAt ? "Débloquer" : "Bloquer"}
              </Button>
            }
          />
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="flex flex-col gap-4 xl:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded border border-line bg-surface p-4"><p className="text-xs text-ink-muted uppercase">Total dépensé</p><p className="text-2xl font-semibold tabular-nums">{formatPrice(c.totalSpent)}</p></div>
                <div className="rounded border border-line bg-surface p-4"><p className="text-xs text-ink-muted uppercase">Commandes payées</p><p className="text-2xl font-semibold tabular-nums">{c.paidOrders}</p></div>
              </div>
              <Panel title={`Commandes (${c.orders.length})`}>
                {c.orders.length === 0 ? <p className="text-ink-muted">Aucune commande.</p> : (
                  <ul>
                    {orders.items.map((o) => (
                      <li key={o.id} className="flex h-10 items-center gap-3 border-b border-line last:border-b-0">
                        <Link href={`/admin/commandes/${o.id}`} className="w-16 font-medium tabular-nums hover:underline">#{o.number}</Link>
                        <span className="w-24 text-ink-muted">{new Date(o.createdAt).toLocaleDateString("fr-FR")}</span>
                        <span className="flex-1"><OrderStatusBadge status={o.status} /></span>
                        <span className="tabular-nums">{formatPrice(o.total, o.currency)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {c.orders.length > 0 && <Pagination density="admin" noun="commandes" className="mt-3 border-t border-line pt-3" {...orders.pagination} />}
              </Panel>
              <Panel title={`Avis (${c.reviews.length})`}>
                {c.reviews.length === 0 ? <p className="text-ink-muted">Aucun avis.</p> : (
                  <ul className="flex flex-col gap-2">
                    {c.reviews.map((r) => <li key={r.id}><span className="font-medium">{r.product.name}</span> · {r.rating}/5 · <span className="text-ink-muted">{r.text.slice(0, 80)}</span></li>)}
                  </ul>
                )}
              </Panel>
            </div>
            <div className="flex flex-col gap-4">
              <Notes customer={c} />
              <Panel title="Adresses">
                {c.addresses.length === 0 ? <p className="text-ink-muted">Aucune adresse.</p> : (
                  <ul className="flex flex-col gap-3">
                    {c.addresses.map((a) => <li key={a.id}>{a.name}{a.isDefault && " (principale)"}<br /><span className="text-ink-muted">{a.line1}, {a.city} · {a.phone}</span></li>)}
                  </ul>
                )}
              </Panel>
            </div>
          </div>
        </>
      )}
    </QueryState>
  );
}
