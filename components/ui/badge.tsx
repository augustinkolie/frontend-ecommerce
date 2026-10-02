import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "ink" | "neutral" | "accent" | "success" | "warning" | "danger" | "focus";

const tones: Record<BadgeTone, string> = {
  ink: "bg-ink text-on-ink",
  neutral: "bg-surface-alt text-ink",
  accent: "bg-accent text-on-ink",
  success: "bg-success text-on-ink",
  warning: "bg-warning text-on-ink",
  danger: "bg-danger text-on-ink",
  focus: "bg-focus text-on-ink",
};

/** Texte 12 px majuscules sur une seule ligne, fond plein, rayon 2 px. */
export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-sm px-2 text-xs font-semibold tracking-caps whitespace-nowrap uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

const orderStatus: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  PENDING_PAYMENT: { label: "À payer", tone: "warning" },
  PAID: { label: "Payée", tone: "focus" },
  PREPARING: { label: "En préparation", tone: "ink" },
  SHIPPED: { label: "Expédiée", tone: "neutral" },
  DELIVERED: { label: "Livrée", tone: "success" },
  CANCELLED: { label: "Annulée", tone: "danger" },
  REFUNDED: { label: "Remboursée", tone: "neutral" },
};

export const ORDER_STATUSES = Object.keys(orderStatus) as OrderStatus[];

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, tone } = orderStatus[status];
  return <Badge tone={tone}>{label}</Badge>;
}
