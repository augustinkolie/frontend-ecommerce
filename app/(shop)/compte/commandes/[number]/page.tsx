import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusBadge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { apiAuthedOrNull } from "@/lib/api/client";
import type { CustomerOrder } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { ReturnRequestForm } from "./return-form";

const TRACK: { status: CustomerOrder["status"][]; label: string }[] = [
  { status: ["PENDING_PAYMENT", "PAID", "PREPARING", "SHIPPED", "DELIVERED"], label: "Commandée" },
  { status: ["PREPARING", "SHIPPED", "DELIVERED"], label: "En préparation" },
  { status: ["SHIPPED", "DELIVERED"], label: "Expédiée" },
  { status: ["DELIVERED"], label: "Livrée" },
];

export default async function OrderDetailPage({ params }: PageProps<"/compte/commandes/[number]">) {
  const { number } = await params;
  const order = await apiAuthedOrNull<CustomerOrder>(`/me/orders/${encodeURIComponent(number)}`);
  if (!order) notFound();
  const cancelled = order.status === "CANCELLED" || order.status === "REFUNDED";
  const a = order.shippingAddress;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/compte/commandes" className="text-sm text-ink-muted underline-offset-4 hover:underline">← Commandes</Link>
          <h2 className="mt-2 font-serif text-2xl font-normal tracking-title">Commande n° {order.number}</h2>
          <p className="text-sm text-ink-muted">{new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {!cancelled && (
        <ol className="grid grid-cols-4 gap-2" aria-label="Suivi">
          {TRACK.map((s) => {
            const done = s.status.includes(order.status);
            return (
              <li key={s.label} className="flex flex-col gap-2">
                <span className={cn("h-1", done ? "bg-ink" : "bg-line")} aria-hidden />
                <span className={cn("text-xs", done ? "text-ink" : "text-ink-muted")}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      )}
      {order.shipment?.trackingNumber && (
        <p className="text-sm">
          Transporteur : {order.shipment.carrier} · Suivi <span className="font-medium tabular-nums">{order.shipment.trackingNumber}</span>
        </p>
      )}

      <ul className="divide-y divide-line border-y border-line">
        {order.items.map((i) => (
          <li key={i.id} className="flex gap-4 py-4">
            <div className="relative aspect-product w-16 shrink-0 bg-surface-alt">
              {i.variant?.product.images[0] && <Image src={i.variant.product.images[0].url} alt="" fill sizes="64px" className="object-cover" />}
            </div>
            <div className="flex flex-1 flex-col gap-1 text-sm">
              {i.variant ? <Link href={`/p/${i.variant.product.slug}`} className="hover:underline">{i.name}</Link> : <span>{i.name}</span>}
              <span className="text-xs text-ink-muted">{i.attributes.map((x) => x.value).join(" · ")} · Qté {i.quantity}</span>
            </div>
            <Price amount={i.unitPrice * i.quantity} currency={order.currency} size="sm" />
          </li>
        ))}
      </ul>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="text-sm">
          <h3 className="mb-2 text-xs font-semibold tracking-caps text-ink-muted uppercase">Livraison</h3>
          <p>{order.shippingMethod}<br />{a.name} · {a.phone}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}{a.city ? `, ${a.city}` : ""}</p>
        </div>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><dt>Sous-total</dt><dd><Price amount={order.subtotal} currency={order.currency} size="sm" /></dd></div>
          {order.discountTotal > 0 && <div className="flex justify-between text-accent"><dt>Remise</dt><dd className="tabular-nums">−{new Intl.NumberFormat("fr-FR").format(order.discountTotal)} {order.currency}</dd></div>}
          <div className="flex justify-between"><dt>Livraison</dt><dd>{order.shippingTotal ? <Price amount={order.shippingTotal} currency={order.currency} size="sm" /> : "Offerte"}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Total</dt><dd><Price amount={order.total} currency={order.currency} /></dd></div>
        </dl>
      </div>

      {order.events && order.events.length > 0 && (
        <section aria-labelledby="history-title">
          <h3 id="history-title" className="mb-2 text-xs font-semibold tracking-caps text-ink-muted uppercase">Historique</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {order.events.map((e) => (
              <li key={e.id} className="flex gap-4">
                <span className="w-28 shrink-0 text-ink-muted tabular-nums">{new Date(e.createdAt).toLocaleDateString("fr-FR")}</span>
                <span>{e.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {order.status === "DELIVERED" && (
        <section aria-labelledby="return-title" className="border-t border-line pt-8">
          <h3 id="return-title" className="mb-4 font-serif text-xl tracking-title">Retourner des articles</h3>
          {order.returns && order.returns.length > 0 ? (
            <p className="text-sm">Une demande de retour est en cours ({order.returns[0]!.status}). Suivez-la dans <Link href="/compte/retours" className="underline">Retours</Link>.</p>
          ) : (
            <ReturnRequestForm orderNumber={order.number} items={order.items.map((i) => ({ id: i.id, label: `${i.name} — ${i.attributes.map((x) => x.value).join(" · ")}`, quantity: i.quantity }))} />
          )}
        </section>
      )}
    </div>
  );
}
