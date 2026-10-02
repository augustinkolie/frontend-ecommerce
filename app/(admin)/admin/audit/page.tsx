"use client";

import { Fragment, useState } from "react";
import { EmptyBlock, PageHeader, QueryState } from "@/components/admin/page";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/field";
import { qs, usePagedList } from "@/lib/admin/hooks";
import type { AuditEntry } from "@/lib/admin/types";

const ENTITIES = ["Product", "ProductVariant", "Order", "Category", "Collection", "Coupon", "CategorySale", "Review", "User", "ContentBlock", "Page", "Setting", "ShippingZone", "ReturnRequest"];

/** Journal d'audit : qui a modifié quoi, quand (avant / après). */
export default function AuditPage() {
  const [entity, setEntity] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const list = usePagedList<AuditEntry>(`/admin/audit${qs({ entityType: entity })}`, "audit");

  return (
    <>
      <PageHeader
        title="Journal d'audit"
        actions={
          <div className="w-48">
            <label htmlFor="a-entity" className="sr-only">Type d&apos;élément</label>
            <Select id="a-entity" density="admin" value={entity} onChange={(e) => setEntity(e.target.value)}>
              <option value="">Tous les éléments</option>
              {ENTITIES.map((e) => <option key={e} value={e}>{e}</option>)}
            </Select>
          </div>
        }
      />
      <QueryState query={list}>
        {() =>
          list.items.length === 0 ? (
            <EmptyBlock title="Aucune entrée" />
          ) : (
            <div className="overflow-x-auto rounded border border-line bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-alt text-left text-xs text-ink-muted uppercase">
                    <th className="h-10 px-3 font-semibold">Date</th><th className="px-3 font-semibold">Auteur</th><th className="px-3 font-semibold">Action</th><th className="px-3 font-semibold">Élément</th><th className="px-3"><span className="sr-only">Détail</span></th>
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((a) => (
                    <Fragment key={a.id}>
                      <tr className="h-10 border-t border-line">
                        <td className="px-3 whitespace-nowrap tabular-nums">{new Date(a.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" })}</td>
                        <td className="px-3">{a.author?.name ?? a.author?.email ?? "Système"}</td>
                        <td className="px-3 font-medium">{a.action}</td>
                        <td className="px-3 text-ink-muted">{a.entityType} · {a.entityId.slice(0, 12)}</td>
                        <td className="px-3 text-right">
                          {(a.before != null || a.after != null) && (
                            <Button size="admin" variant="ghost" aria-expanded={open === a.id} onClick={() => setOpen(open === a.id ? null : a.id)}>{open === a.id ? "Masquer" : "Avant / après"}</Button>
                          )}
                        </td>
                      </tr>
                      {open === a.id && (
                        <tr className="border-t border-line bg-surface-alt">
                          <td colSpan={5} className="p-3">
                            <div className="grid gap-3 md:grid-cols-2">
                              <div><p className="mb-1 text-xs font-semibold uppercase">Avant</p><pre className="max-h-72 overflow-auto text-xs whitespace-pre-wrap">{JSON.stringify(a.before, null, 2) ?? "—"}</pre></div>
                              <div><p className="mb-1 text-xs font-semibold uppercase">Après</p><pre className="max-h-72 overflow-auto text-xs whitespace-pre-wrap">{JSON.stringify(a.after, null, 2) ?? "—"}</pre></div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </QueryState>
      {list.items.length > 0 && <Pagination density="admin" noun="entrées" className="mt-3" {...list.pagination} />}
    </>
  );
}
