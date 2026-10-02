import { Suspense } from "react";
import Link from "next/link";
import { OrderRow } from "@/components/shop/order-bits";
import { EmptyState } from "@/components/ui/empty-state";
import { apiAuthed } from "@/lib/api/client";
import { LinkPagination } from "@/components/ui/pagination";
import type { CustomerOrder } from "@/lib/api/types";
import { ACCOUNT_PAGE_SIZES, readPageParams, slicePage } from "@/lib/pagination";

export const metadata = { title: "Commandes" };

export default async function OrdersPage({ searchParams }: PageProps<"/compte/commandes">) {
  const orders = await apiAuthed<CustomerOrder[]>("/me/orders");
  const { page, pageSize } = readPageParams(await searchParams, ACCOUNT_PAGE_SIZES);
  const view = slicePage(orders, page, pageSize);
  return (
    <section aria-labelledby="orders-title">
      <h2 id="orders-title" className="mb-4 font-serif text-2xl font-normal tracking-title">Commandes</h2>
      {orders.length === 0 ? (
        <EmptyState title="Aucune commande" description="Vos commandes apparaîtront ici." action={<Link href="/" className="underline underline-offset-4">Découvrir la boutique</Link>} />
      ) : (
        <>
          <ul className="divide-y divide-line border-y border-line">
            {view.items.map((o) => <OrderRow key={o.id} order={o} />)}
          </ul>
          <Suspense>
            <LinkPagination className="mt-8" page={view.page} pageCount={view.pageCount} total={view.total} pageSize={pageSize} pageSizes={ACCOUNT_PAGE_SIZES} noun={view.total > 1 ? "commandes" : "commande"} />
          </Suspense>
        </>
      )}
    </section>
  );
}
