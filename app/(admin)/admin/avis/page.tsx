"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { EmptyBlock, PageHeader, QueryState } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Modal } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/field";
import { qs, usePagedList, useApiMutation } from "@/lib/admin/hooks";
import type { AdminReview } from "@/lib/admin/types";
import { cn } from "@/lib/cn";

const STATUS = { PENDING: { label: "À modérer", tone: "warning" }, APPROVED: { label: "Publié", tone: "success" }, HIDDEN: { label: "Masqué", tone: "neutral" } } as const;

export default function ReviewsPage() {
  const [status, setStatus] = useState<"" | AdminReview["status"]>("PENDING");
  const list = usePagedList<AdminReview>(`/admin/reviews${qs({ status })}`, "avis");
  const moderate = useApiMutation(["/admin/reviews"], "Avis mis à jour");
  const [reply, setReply] = useState<{ review: AdminReview; text: string } | null>(null);

  return (
    <>
      <PageHeader title="Avis" description="Seuls les avis publiés apparaissent sur la boutique. Achat vérifié obligatoire." />
      <div role="tablist" className="mb-4 flex gap-4 border-b border-line">
        {([["PENDING", "À modérer"], ["APPROVED", "Publiés"], ["HIDDEN", "Masqués"], ["", "Tous"]] as const).map(([v, l]) => (
          <button key={l} role="tab" type="button" aria-selected={status === v} onClick={() => setStatus(v)} className={cn("-mb-px h-10 border-b-2 text-sm font-medium", status === v ? "border-accent" : "border-transparent text-ink-muted hover:text-ink")}>
            {l}
          </button>
        ))}
      </div>
      <QueryState query={list}>
        {() =>
          list.items.length === 0 ? (
            <EmptyBlock title="Aucun avis" description="Rien à modérer pour l'instant." />
          ) : (
            <ul className="flex flex-col gap-3">
              {list.items.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 rounded border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex" aria-label={`${r.rating} sur 5`}>
                      {[1, 2, 3, 4, 5].map((n) => <Star key={n} aria-hidden size={14} strokeWidth={1.5} className={n <= r.rating ? "fill-ink text-ink" : "text-line"} />)}
                    </span>
                    <Link href={`/admin/produits/${r.product.id}`} className="font-medium hover:underline">{r.product.name}</Link>
                    <span className="text-ink-muted">{r.user.name ?? r.user.email} · {new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
                    <span className="ml-auto"><Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge></span>
                  </div>
                  <p>{r.text}</p>
                  {r.reply && <p className="border-l-2 border-line pl-3 text-ink-muted">Réponse : {r.reply}</p>}
                  <div className="flex gap-2">
                    {r.status !== "APPROVED" && <Button size="admin" variant="accent" onClick={() => moderate.mutate({ path: `/admin/reviews/${r.id}`, method: "PATCH", json: { status: "APPROVED" } })}>Approuver</Button>}
                    {r.status !== "HIDDEN" && <Button size="admin" variant="secondary" onClick={() => moderate.mutate({ path: `/admin/reviews/${r.id}`, method: "PATCH", json: { status: "HIDDEN" } })}>Masquer</Button>}
                    <Button size="admin" variant="ghost" onClick={() => setReply({ review: r, text: r.reply ?? "" })}>{r.reply ? "Modifier la réponse" : "Répondre"}</Button>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </QueryState>
      {list.items.length > 0 && <Pagination density="admin" noun="avis" className="mt-3" {...list.pagination} />}

      <Modal
        open={!!reply}
        onOpenChange={(o) => !o && setReply(null)}
        title="Répondre à l'avis"
        description="La réponse est publiée sous l'avis, au nom de la boutique."
        footer={
          <>
            <Button size="admin" variant="ghost" onClick={() => setReply(null)}>Annuler</Button>
            <Button size="admin" variant="accent" onClick={() => reply && moderate.mutate({ path: `/admin/reviews/${reply.review.id}`, method: "PATCH", json: { reply: reply.text || null } }, { onSuccess: () => setReply(null) })}>Publier la réponse</Button>
          </>
        }
      >
        {reply && (
          <>
            <p className="mb-3 text-ink-muted">« {reply.review.text} »</p>
            <label htmlFor="reply" className="sr-only">Réponse</label>
            <Textarea id="reply" className="text-sm" value={reply.text} onChange={(e) => setReply({ ...reply, text: e.target.value })} />
          </>
        )}
      </Modal>
    </>
  );
}
