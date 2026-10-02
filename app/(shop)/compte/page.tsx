import type { ReactNode } from "react";
import Link from "next/link";
import { Heart, MapPin, Package, type LucideIcon } from "lucide-react";
import { OrderRow } from "@/components/shop/order-bits";
import { buttonClasses } from "@/components/ui/button";
import { apiAuthed } from "@/lib/api/client";
import type { Address, CustomerOrder, ProductCard, User } from "@/lib/api/types";

/** Bloc encadré de la vue d'ensemble : titre, lien d'action, contenu. */
function Panel({ title, id, action, children, className }: { title: string; id: string; action?: { href: string; label: string }; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={`flex flex-col rounded border border-line bg-surface ${className ?? ""}`}>
      <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-4 md:px-6">
        <h2 id={id} className="text-base font-medium">{title}</h2>
        {action && (
          <Link href={action.href} className="text-sm text-ink-muted underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink">
            {action.label}
          </Link>
        )}
      </div>
      <div className="flex flex-1 flex-col px-5 py-5 md:px-6">{children}</div>
    </section>
  );
}

function Stat({ href, icon: Icon, value, label }: { href: string; icon: LucideIcon; value: number; label: string }) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded border border-line bg-surface p-5 transition-colors duration-150 hover:border-ink">
      <Icon aria-hidden size={20} strokeWidth={1.5} className="shrink-0 text-ink-muted group-hover:text-ink" />
      <span className="flex flex-col">
        <span className="font-serif text-2xl tabular-nums">{value}</span>
        <span className="text-sm text-ink-muted">{label}</span>
      </span>
    </Link>
  );
}

export default async function AccountHome() {
  const [orders, addresses, wishlist, user] = await Promise.all([
    apiAuthed<CustomerOrder[]>("/me/orders"),
    apiAuthed<Address[]>("/me/addresses"),
    apiAuthed<ProductCard[]>("/me/wishlist"),
    apiAuthed<User>("/me"),
  ]);
  const main = addresses.find((a) => a.isDefault) ?? addresses[0];
  const plural = (n: number, one: string, many: string) => (n > 1 ? many : one);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat href="/compte/commandes" icon={Package} value={orders.length} label={plural(orders.length, "Commande", "Commandes")} />
        <Stat href="/compte/favoris" icon={Heart} value={wishlist.length} label={plural(wishlist.length, "Favori", "Favoris")} />
        <Stat href="/compte/adresses" icon={MapPin} value={addresses.length} label={plural(addresses.length, "Adresse", "Adresses")} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          id="recent-title"
          title="Commandes récentes"
          action={orders.length > 0 ? { href: "/compte/commandes", label: "Tout voir" } : undefined}
          className="xl:col-span-2"
        >
          {orders.length === 0 ? (
            <div className="flex flex-1 flex-col items-start justify-center gap-4 py-6">
              <Package aria-hidden size={24} strokeWidth={1.5} className="text-ink-muted" />
              <div className="flex flex-col gap-1">
                <p className="font-medium">Aucune commande pour le moment</p>
                <p className="text-sm text-ink-muted">Vos commandes et leur suivi de livraison apparaîtront ici.</p>
              </div>
              <Link href="/" className={buttonClasses({ size: "admin" })}>
                Découvrir la boutique
              </Link>
            </div>
          ) : (
            <ul className="-my-4 divide-y divide-line">
              {orders.slice(0, 4).map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </ul>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel id="addr-title" title="Adresse principale" action={{ href: "/compte/adresses", label: main ? "Gérer" : "Ajouter" }}>
            {main ? (
              <address className="text-sm leading-relaxed not-italic">
                <span className="font-medium">{main.name}</span>
                <br />
                {main.line1}
                {main.line2 ? `, ${main.line2}` : ""}
                <br />
                {main.city}, {main.country}
                <br />
                <span className="text-ink-muted tabular-nums">{main.phone}</span>
              </address>
            ) : (
              <p className="text-sm text-ink-muted">Aucune adresse enregistrée. Ajoutez-en une pour commander plus vite.</p>
            )}
          </Panel>

          <Panel id="profile-title" title="Profil" action={{ href: "/compte/profil", label: "Modifier" }}>
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex flex-col gap-0.5">
                <dt className="text-ink-muted">Nom</dt>
                <dd>{user.name ?? "—"}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-ink-muted">E-mail</dt>
                <dd className="break-all">{user.email}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-ink-muted">Téléphone</dt>
                <dd className="tabular-nums">{user.phone ?? "—"}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
