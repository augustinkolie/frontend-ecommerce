import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, Clock } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { apiAuthedOrNull, apiFetchOrNull } from "@/lib/api/client";
import type { PublicOrder, User } from "@/lib/api/types";
import { getSettings } from "@/lib/shop";

export const metadata: Metadata = { title: "Confirmation de commande", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ searchParams }: PageProps<"/commande/confirmation">) {
  const { order: id } = await searchParams;
  if (typeof id !== "string") notFound();
  const [order, settings, user] = await Promise.all([
    apiFetchOrNull<PublicOrder>(`/orders/${encodeURIComponent(id)}`, { revalidate: 0 }),
    getSettings(),
    apiAuthedOrNull<User>("/me"),
  ]);
  if (!order) notFound();
  const paid = order.status !== "PENDING_PAYMENT" || order.paymentMethod === "cash_on_delivery";
  const payment = settings.paymentMethods.find((m) => m.code === order.paymentMethod)?.label ?? order.paymentMethod;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 pt-16">
      <ol className="flex gap-4 border-b border-line pb-4 text-sm text-ink-muted" aria-label="Étapes de la commande">
        <li>1 Coordonnées & livraison</li>
        <li>2 Paiement</li>
        <li aria-current="step" className="font-medium text-ink">3 Confirmation</li>
      </ol>

      <div className="flex flex-col gap-3">
        {paid ? <CircleCheck aria-hidden size={20} strokeWidth={1.5} className="text-success" /> : <Clock aria-hidden size={20} strokeWidth={1.5} className="text-warning" />}
        <h1 className="font-serif text-4xl font-normal tracking-title">{paid ? "Merci, votre commande est confirmée" : "Paiement en attente"}</h1>
        <p className="text-lg">
          Commande n° <span className="font-semibold tabular-nums">{order.number}</span>
        </p>
        <p className="text-ink-muted">
          {paid
            ? `Un e-mail de confirmation a été envoyé à ${order.email}. Paiement : ${payment}. Livraison : ${order.shippingMethod}.`
            : "Nous n'avons pas encore reçu la confirmation de paiement. Vos articles restent réservés 15 minutes."}
        </p>
      </div>

      <ul className="divide-y divide-line border-y border-line">
        {order.items.map((i, idx) => (
          <li key={idx} className="flex justify-between gap-4 py-3 text-sm">
            <span>
              {i.name} × {i.quantity}
              <br />
              <span className="text-xs text-ink-muted">{i.attributes.map((a) => a.value).join(" · ")}</span>
            </span>
            <Price amount={i.unitPrice * i.quantity} currency={order.currency} size="sm" />
          </li>
        ))}
      </ul>
      <p className="flex justify-between text-base font-semibold">
        <span>Total</span>
        <Price amount={order.total} currency={order.currency} />
      </p>

      <div className="flex flex-wrap gap-4">
        {user ? (
          <Link href={`/compte/commandes/${order.number}`} className={buttonClasses()}>Suivre ma commande</Link>
        ) : (
          <Link href="/inscription" className={buttonClasses()}>Créer un compte pour suivre mes commandes</Link>
        )}
        <Link href="/" className={buttonClasses({ variant: "secondary" })}>Continuer mes achats</Link>
      </div>
    </div>
  );
}
