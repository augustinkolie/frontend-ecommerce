import { Suspense } from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { apiAuthed } from "@/lib/api/client";
import { LinkPagination } from "@/components/ui/pagination";
import type { ReturnRequest } from "@/lib/api/types";
import { ACCOUNT_PAGE_SIZES, readPageParams, slicePage } from "@/lib/pagination";

export const metadata = { title: "Retours" };

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  REQUESTED: { label: "Demandé", tone: "warning" },
  ACCEPTED: { label: "Accepté", tone: "focus" },
  REFUSED: { label: "Refusé", tone: "danger" },
  RECEIVED: { label: "Reçu", tone: "ink" },
  REFUNDED: { label: "Remboursé", tone: "success" },
};

export default async function ReturnsPage({ searchParams }: PageProps<"/compte/retours">) {
  const returns = await apiAuthed<ReturnRequest[]>("/me/returns");
  const { page, pageSize } = readPageParams(await searchParams, ACCOUNT_PAGE_SIZES);
  const view = slicePage(returns, page, pageSize);
  return (
    <section aria-labelledby="ret-title" className="flex flex-col gap-4">
      <h2 id="ret-title" className="font-serif text-2xl font-normal tracking-title">
        Retours
      </h2>
      <p className="text-sm text-ink-muted">
        Vous disposez de 14 jours après réception. Pour retourner un article, ouvrez la commande livrée concernée depuis{" "}
        <Link href="/compte/commandes" className="underline">
          vos commandes
        </Link>
        .
      </p>
      {returns.length === 0 ? (
        <EmptyState title="Aucun retour" description="Vos demandes de retour apparaîtront ici." />
      ) : (
        <>
          <ul className="divide-y divide-line border-y border-line">
            {view.items.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-4 py-4 text-sm">
                <div>
                  <Link href={`/compte/commandes/${r.order.number}`} className="font-medium hover:underline">
                    Commande n° {r.order.number}
                  </Link>
                  <p className="text-ink-muted">{r.reason}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-ink-muted">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
                  <Badge tone={STATUS[r.status]?.tone ?? "neutral"}>{STATUS[r.status]?.label ?? r.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
          <Suspense>
            <LinkPagination className="mt-4" page={view.page} pageCount={view.pageCount} total={view.total} pageSize={pageSize} pageSizes={ACCOUNT_PAGE_SIZES} noun="retours" />
          </Suspense>
        </>
      )}
    </section>
  );
}
