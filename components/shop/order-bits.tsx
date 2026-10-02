import Link from "next/link";
import { OrderStatusBadge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import type { CustomerOrder } from "@/lib/api/types";

export function OrderRow({ order }: { order: CustomerOrder }) {
  return (
    <li>
      <Link href={`/compte/commandes/${order.number}`} className="flex flex-wrap items-center justify-between gap-4 py-4 hover:bg-surface-alt md:px-2">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium tabular-nums">Commande n° {order.number}</span>
          <span className="text-xs text-ink-muted">
            {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {order.items.reduce((n, i) => n + i.quantity, 0)} article(s)
          </span>
        </div>
        <div className="flex items-center gap-4">
          <OrderStatusBadge status={order.status} />
          <Price amount={order.total} currency={order.currency} size="sm" />
        </div>
      </Link>
    </li>
  );
}
