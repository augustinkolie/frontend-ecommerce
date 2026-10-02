"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { PageHeader, Panel, QueryState } from "@/components/admin/page";
import { ADMIN_NAV } from "@/components/admin/nav";
import { useAdminUser } from "@/components/admin/shell";
import { SalesChart } from "@/components/admin/sales-chart";
import { OrderStatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/admin/hooks";
import type { Dashboard } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";

const CURRENCY = "GNF";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded border border-line bg-surface p-4">
      <p className="text-xs font-semibold tracking-caps text-ink-muted uppercase">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [range, setRange] = useState("30d");
  const user = useAdminUser();
  const router = useRouter();
  const allowed = user.permissions.includes("dashboard");
  // Rôles sans tableau de bord : premier module autorisé.
  useEffect(() => {
    if (!allowed) router.replace(ADMIN_NAV.find((n) => user.permissions.includes(n.permission))?.href ?? "/");
  }, [allowed, router, user.permissions]);
  const query = useApi<Dashboard>(allowed ? `/admin/stats?range=${range}` : null, { refetchInterval: 60_000 });
  if (!allowed) return null;

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        actions={
          <div className="w-40">
            <label htmlFor="range" className="sr-only">Période</label>
            <Select id="range" density="admin" value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="1d">Aujourd&apos;hui</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">90 derniers jours</option>
            </Select>
          </div>
        }
      />
      <QueryState
        query={query}
        skeleton={
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}
            <Skeleton className="h-64 md:col-span-4" />
          </div>
        }
      >
        {(d) => (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="CA aujourd'hui" value={formatPrice(d.revenue.today, CURRENCY)} />
              <Stat label="CA 7 jours" value={formatPrice(d.revenue.week, CURRENCY)} />
              <Stat label="CA 30 jours" value={formatPrice(d.revenue.month, CURRENCY)} />
              <Link href="/admin/commandes?status=PAID" className="rounded hover:outline-1 hover:outline-accent">
                <Stat label="Commandes à traiter" value={String(d.toProcess)} hint="Payées ou en préparation" />
              </Link>
              <Stat label="Panier moyen" value={formatPrice(d.averageOrder, CURRENCY)} hint={`${d.ordersInRange} commande(s) sur la période`} />
              <Stat label="Taux de conversion" value={`${d.conversionRate.toLocaleString("fr-FR")} %`} hint="Commandes payées / paniers créés" />
            </div>

            <Panel title="Chiffre d'affaires par jour">
              <SalesChart series={d.series} currency={CURRENCY} />
            </Panel>

            <div className="grid gap-4 xl:grid-cols-3">
              <Panel title="Top 10 produits">
                {d.topProducts.length === 0 ? (
                  <p className="text-ink-muted">Aucune vente sur la période.</p>
                ) : (
                  <ol className="flex flex-col">
                    {d.topProducts.map((p, i) => (
                      <li key={p.productId} className="flex h-10 items-center gap-3 border-b border-line last:border-b-0">
                        <span className="w-5 text-ink-muted tabular-nums">{i + 1}</span>
                        <Link href={`/admin/produits/${p.productId}`} className="flex-1 truncate hover:underline">{p.name}</Link>
                        <span className="tabular-nums">{p.quantity}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>

              <Panel title="Alertes stock faible" actions={<Link href="/admin/stock?level=low" className="text-xs underline">Tout voir</Link>}>
                {d.lowStock.length === 0 ? (
                  <p className="text-ink-muted">Aucune alerte.</p>
                ) : (
                  <ul className="flex flex-col">
                    {d.lowStock.map((v) => (
                      <li key={v.variantId} className="flex h-10 items-center gap-3 border-b border-line last:border-b-0">
                        <TriangleAlert aria-hidden size={16} strokeWidth={1.5} className={v.available <= 0 ? "text-danger" : "text-warning"} />
                        <Link href={`/admin/produits/${v.productId}`} className="flex-1 truncate hover:underline">
                          {v.name} <span className="text-ink-muted">· {v.variant}</span>
                        </Link>
                        <span className={`tabular-nums ${v.available <= 0 ? "text-danger" : "text-warning"}`}>{v.available <= 0 ? "Rupture" : v.available}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Dernières commandes" actions={<Link href="/admin/commandes" className="text-xs underline">Tout voir</Link>}>
                <ul className="flex flex-col">
                  {d.recentOrders.map((o) => (
                    <li key={o.id} className="flex h-10 items-center gap-3 border-b border-line last:border-b-0">
                      <Link href={`/admin/commandes/${o.id}`} className="w-16 font-medium tabular-nums hover:underline">#{o.number}</Link>
                      <span className="flex-1"><OrderStatusBadge status={o.status} /></span>
                      <span className="tabular-nums">{formatPrice(o.total, o.currency)}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        )}
      </QueryState>
    </>
  );
}
