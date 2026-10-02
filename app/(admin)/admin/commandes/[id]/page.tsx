"use client";

import { use, useState } from "react";
import Link from "next/link";
import { FileText, Package } from "lucide-react";
import { useConfirm } from "@/components/admin/confirm";
import { PageHeader, Panel, QueryState } from "@/components/admin/page";
import { OrderStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import { useApi, useApiMutation } from "@/lib/admin/hooks";
import type { AdminOrder } from "@/lib/admin/types";
import type { OrderStatus } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";

const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string }[]>> = {
  PENDING_PAYMENT: [{ status: "PAID", label: "Marquer payée" }, { status: "PREPARING", label: "Préparer (paiement à la livraison)" }],
  PAID: [{ status: "PREPARING", label: "Passer en préparation" }, { status: "SHIPPED", label: "Marquer expédiée" }],
  PREPARING: [{ status: "SHIPPED", label: "Marquer expédiée" }],
  SHIPPED: [{ status: "DELIVERED", label: "Marquer livrée" }],
};

const PAYMENT_STATUS: Record<string, string> = { PENDING: "En attente", SUCCEEDED: "Réussi", FAILED: "Échoué", REFUNDED: "Remboursé", PARTIALLY_REFUNDED: "Remboursé partiellement" };

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useApi<AdminOrder>(`/admin/orders/${id}`);
  const invalidate = [`/admin/orders`, "/admin/stats"];
  const mutate = useApiMutation(invalidate, "Commande mise à jour");
  const confirm = useConfirm();
  const [ship, setShip] = useState(false);
  const [carrier, setCarrier] = useState("Livreur Leppi");
  const [tracking, setTracking] = useState("");
  const [refundOpen, setRefundOpen] = useState(false);
  const [refund, setRefund] = useState({ amount: "", reason: "", restock: true });
  const [note, setNote] = useState("");

  return (
    <QueryState query={query}>
      {(o) => {
        const refundable = o.payments.filter((p) => ["SUCCEEDED", "PARTIALLY_REFUNDED"].includes(p.status)).reduce((n, p) => n + p.amount - p.refundedAmount, 0);
        const setStatus = async (status: OrderStatus) => {
          if (status === "SHIPPED") return setShip(true);
          if (status === "CANCELLED" && !(await confirm({ title: "Annuler la commande", message: `La commande n° ${o.number} sera annulée et le stock remis en vente.`, confirmLabel: "Annuler la commande", danger: true }))) return;
          mutate.mutate({ path: `/admin/orders/${o.id}/status`, json: { status, notify: true } });
        };
        const a = o.shippingAddress;
        return (
          <>
            <PageHeader
              title={`Commande n° ${o.number}`}
              back={{ href: "/admin/commandes", label: "Commandes" }}
              description={<>{new Date(o.createdAt).toLocaleString("fr-FR")} · <OrderStatusBadge status={o.status} /></>}
              actions={
                <>
                  <a href={`/api/admin/orders/${o.id}/packing-slip`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-sm border border-ink px-3 text-sm font-medium hover:bg-surface-alt">
                    <Package aria-hidden size={16} strokeWidth={1.5} /> Bon de préparation
                  </a>
                  <a href={`/api/admin/orders/${o.id}/invoice`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-sm border border-ink px-3 text-sm font-medium hover:bg-surface-alt">
                    <FileText aria-hidden size={16} strokeWidth={1.5} /> Facture
                  </a>
                  {NEXT[o.status]?.map((n) => (
                    <Button key={n.status} size="admin" variant="accent" disabled={mutate.isPending} onClick={() => void setStatus(n.status)}>{n.label}</Button>
                  ))}
                  {["PENDING_PAYMENT", "PAID", "PREPARING"].includes(o.status) && (
                    <Button size="admin" variant="ghost" onClick={() => void setStatus("CANCELLED")}>Annuler</Button>
                  )}
                  {refundable > 0 && <Button size="admin" variant="secondary" onClick={() => setRefundOpen(true)}>Rembourser</Button>}
                </>
              }
            />

            <div className="grid gap-4 xl:grid-cols-3">
              <div className="flex flex-col gap-4 xl:col-span-2">
                <Panel title={`Articles (${o.items.reduce((n, i) => n + i.quantity, 0)})`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-ink-muted uppercase">
                        <th className="pb-2 font-semibold">Article</th><th className="pb-2 font-semibold">SKU</th><th className="pb-2 text-right font-semibold">Qté</th><th className="pb-2 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {o.items.map((i) => (
                        <tr key={i.id} className="h-10 border-t border-line">
                          <td>{i.name} <span className="text-ink-muted">· {i.attributes.map((x) => x.value).join(" · ")}</span></td>
                          <td className="text-ink-muted">{i.sku}</td>
                          <td className="text-right tabular-nums">{i.quantity}</td>
                          <td className="text-right tabular-nums">{formatPrice(i.unitPrice * i.quantity, o.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <dl className="mt-4 ml-auto flex max-w-xs flex-col gap-1 text-sm">
                    <div className="flex justify-between"><dt>Sous-total</dt><dd className="tabular-nums">{formatPrice(o.subtotal, o.currency)}</dd></div>
                    {o.discountTotal > 0 && <div className="flex justify-between"><dt>Remise {o.coupon?.code}</dt><dd className="tabular-nums">−{formatPrice(o.discountTotal, o.currency)}</dd></div>}
                    <div className="flex justify-between"><dt>Livraison</dt><dd className="tabular-nums">{formatPrice(o.shippingTotal, o.currency)}</dd></div>
                    <div className="flex justify-between border-t border-line pt-1 font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(o.total, o.currency)}</dd></div>
                  </dl>
                </Panel>

                <Panel title="Historique et notes internes">
                  <form
                    className="mb-4 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!note.trim()) return;
                      mutate.mutate({ path: `/admin/orders/${o.id}/notes`, json: { message: note } }, { onSuccess: () => setNote("") });
                    }}
                  >
                    <label htmlFor="note" className="sr-only">Note interne</label>
                    <Input id="note" density="admin" placeholder="Ajouter une note interne…" value={note} onChange={(e) => setNote(e.target.value)} />
                    <Button type="submit" size="admin" variant="secondary">Ajouter</Button>
                  </form>
                  <ol className="flex flex-col">
                    {o.events.map((e) => (
                      <li key={e.id} className="flex gap-3 border-b border-line py-2 last:border-b-0">
                        <span className="w-32 shrink-0 text-xs text-ink-muted tabular-nums">{new Date(e.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
                        <span className="flex-1">
                          {e.message}
                          {e.type === "note" && <span className="ml-2 text-xs text-ink-muted">(note interne)</span>}
                        </span>
                        <span className="text-xs text-ink-muted">{e.author?.name ?? e.author?.email ?? "Système"}</span>
                      </li>
                    ))}
                  </ol>
                </Panel>
              </div>

              <div className="flex flex-col gap-4">
                <Panel title="Client">
                  <p>{a.name}<br />{o.email}<br />{a.phone}</p>
                  {o.user ? <Link href={`/admin/clients/${o.user.id}`} className="mt-2 inline-block text-xs underline">Fiche client</Link> : <p className="mt-2 text-xs text-ink-muted">Commande invitée</p>}
                </Panel>
                <Panel title="Livraison">
                  <p>{o.shippingMethod}</p>
                  <p className="text-ink-muted">{a.line1}{a.line2 ? `, ${a.line2}` : ""}{a.city ? `, ${a.city}` : ""}</p>
                  {o.shipment && (
                    <p className="mt-2 text-xs">
                      {o.shipment.carrier}{o.shipment.trackingNumber ? ` · ${o.shipment.trackingNumber}` : ""}
                      {o.shipment.shippedAt && <><br />Expédiée le {new Date(o.shipment.shippedAt).toLocaleDateString("fr-FR")}</>}
                      {o.shipment.deliveredAt && <><br />Livrée le {new Date(o.shipment.deliveredAt).toLocaleDateString("fr-FR")}</>}
                    </p>
                  )}
                  {o.internalNotes && <p className="mt-2 border-t border-line pt-2 text-xs">Note client : {o.internalNotes}</p>}
                </Panel>
                <Panel title="Paiements">
                  {o.payments.length === 0 ? (
                    <p className="text-ink-muted">Aucun paiement.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {o.payments.map((p) => (
                        <li key={p.id} className="flex justify-between gap-2">
                          <span>{p.provider}<br /><span className="text-xs text-ink-muted">{PAYMENT_STATUS[p.status] ?? p.status}{p.externalRef ? ` · ${p.externalRef.slice(0, 18)}` : ""}</span></span>
                          <span className="text-right tabular-nums">{formatPrice(p.amount, o.currency)}{p.refundedAmount > 0 && <><br /><span className="text-xs text-ink-muted">−{formatPrice(p.refundedAmount, o.currency)}</span></>}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {o.reservedUntil && <p className="mt-2 text-xs text-warning">Stock réservé jusqu&apos;à {new Date(o.reservedUntil).toLocaleTimeString("fr-FR")}</p>}
                </Panel>
              </div>
            </div>

            <Modal
              open={ship}
              onOpenChange={setShip}
              title="Expédier la commande"
              description="Le client reçoit un e-mail avec le suivi."
              footer={
                <>
                  <Button size="admin" variant="ghost" onClick={() => setShip(false)}>Annuler</Button>
                  <Button
                    size="admin"
                    variant="accent"
                    onClick={() => mutate.mutate({ path: `/admin/orders/${o.id}/status`, json: { status: "SHIPPED", carrier, trackingNumber: tracking || undefined, notify: true } }, { onSuccess: () => setShip(false) })}
                  >
                    Confirmer l&apos;expédition
                  </Button>
                </>
              }
            >
              <div className="flex flex-col gap-4">
                <Field id="carrier" label="Transporteur"><Input id="carrier" density="admin" value={carrier} onChange={(e) => setCarrier(e.target.value)} /></Field>
                <Field id="tracking" label="Numéro de suivi (facultatif)"><Input id="tracking" density="admin" value={tracking} onChange={(e) => setTracking(e.target.value)} /></Field>
              </div>
            </Modal>

            <Modal
              open={refundOpen}
              onOpenChange={setRefundOpen}
              title="Rembourser"
              description={`Montant remboursable : ${formatPrice(refundable, o.currency)}`}
              footer={
                <>
                  <Button size="admin" variant="ghost" onClick={() => setRefundOpen(false)}>Annuler</Button>
                  <Button
                    size="admin"
                    variant="danger"
                    disabled={!Number(refund.amount)}
                    onClick={async () => {
                      const amount = Math.round(Number(refund.amount));
                      if (!(await confirm({ title: "Confirmer le remboursement", message: `Rembourser ${formatPrice(amount, o.currency)} sur la commande n° ${o.number} ?`, confirmLabel: "Rembourser", danger: true }))) return;
                      mutate.mutate({ path: `/admin/orders/${o.id}/refund`, json: { amount, reason: refund.reason, restock: refund.restock } }, { onSuccess: () => setRefundOpen(false) });
                    }}
                  >
                    Rembourser
                  </Button>
                </>
              }
            >
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Button size="admin" variant="secondary" onClick={() => setRefund((r) => ({ ...r, amount: String(refundable) }))}>Total</Button>
                </div>
                <Field id="r-amount" label={`Montant (${o.currency})`}><Input id="r-amount" density="admin" inputMode="numeric" value={refund.amount} onChange={(e) => setRefund((r) => ({ ...r, amount: e.target.value.replace(/\D/g, "") }))} /></Field>
                <Field id="r-reason" label="Motif"><Textarea id="r-reason" value={refund.reason} onChange={(e) => setRefund((r) => ({ ...r, reason: e.target.value }))} /></Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4 accent-accent" checked={refund.restock} onChange={(e) => setRefund((r) => ({ ...r, restock: e.target.checked }))} />
                  Remettre les articles en stock (remboursement total)
                </label>
              </div>
            </Modal>
          </>
        );
      }}
    </QueryState>
  );
}
