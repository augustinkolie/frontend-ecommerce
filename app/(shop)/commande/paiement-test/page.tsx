import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Price } from "@/components/ui/price";
import { apiFetchOrNull } from "@/lib/api/client";
import type { PublicOrder } from "@/lib/api/types";
import { TestPayment } from "./pay";

export const metadata: Metadata = { title: "Paiement", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TestPaymentPage({ searchParams }: PageProps<"/commande/paiement-test">) {
  const { order: id } = await searchParams;
  if (typeof id !== "string") notFound();
  const order = await apiFetchOrNull<PublicOrder>(`/orders/${encodeURIComponent(id)}`, { revalidate: 0 });
  if (!order) notFound();
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-16">
      <p className="text-xs font-semibold tracking-caps text-ink-muted uppercase">Paiement sécurisé — environnement de test</p>
      <h1 className="font-serif text-3xl font-normal tracking-title">Commande n° {order.number}</h1>
      <p className="flex items-baseline justify-between border-y border-line py-4">
        <span>Montant</span>
        <Price amount={order.total} currency={order.currency} size="xl" />
      </p>
      <p className="text-sm text-ink-muted">
        Cette page remplace la page de l&apos;opérateur pendant la recette. Aucune donnée de carte n&apos;est saisie ni stockée.
      </p>
      <TestPayment orderId={order.id} />
    </div>
  );
}
