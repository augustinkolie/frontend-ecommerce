"use client";

import { useState } from "react";
import { useConfirm } from "@/components/admin/confirm";
import { DataTable, type Column } from "@/components/admin/data-table";
import { PageHeader, Panel, QueryState } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { useApi, useApiMutation } from "@/lib/admin/hooks";
import type { AdminCategory, Coupon, Sale } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";

const toLocal = (iso: string | null) => (iso ? iso.slice(0, 16) : "");
const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

function couponState(c: Coupon) {
  const now = Date.now();
  if (c.endsAt && new Date(c.endsAt).getTime() < now) return { label: "Expiré", tone: "neutral" as const };
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return { label: "Programmé", tone: "focus" as const };
  if (c.maxUses != null && c.usedCount >= c.maxUses) return { label: "Épuisé", tone: "neutral" as const };
  return { label: "Actif", tone: "success" as const };
}

type CouponDraft = { id?: string; code: string; type: Coupon["type"]; value: string; minimum: string; startsAt: string; endsAt: string; maxUses: string };
type SaleDraft = { id?: string; name: string; categoryId: string; percent: string; startsAt: string; endsAt: string };

export default function PromotionsPage() {
  const coupons = useApi<Coupon[]>("/admin/coupons");
  const sales = useApi<Sale[]>("/admin/sales");
  const categories = useApi<AdminCategory[]>("/admin/categories");
  const saveCoupon = useApiMutation(["/admin/coupons"], "Code promo enregistré");
  const saveSale = useApiMutation(["/admin/sales"], "Soldes enregistrées");
  const confirm = useConfirm();
  const [coupon, setCoupon] = useState<CouponDraft | null>(null);
  const [sale, setSale] = useState<SaleDraft | null>(null);

  const columns: Column<Coupon>[] = [
    { id: "code", header: "Code", sort: (c) => c.code, cell: (c) => <span className="font-semibold">{c.code}</span> },
    { id: "type", header: "Remise", sort: (c) => c.type, cell: (c) => (c.type === "PERCENT" ? `${c.value} %` : c.type === "AMOUNT" ? formatPrice(c.value) : "Livraison offerte"), csv: (c) => `${c.type} ${c.value}` },
    { id: "min", header: "Minimum", numeric: true, sort: (c) => c.minimum ?? 0, cell: (c) => (c.minimum ? formatPrice(c.minimum) : "—") },
    { id: "dates", header: "Validité", cell: (c) => `${c.startsAt ? new Date(c.startsAt).toLocaleDateString("fr-FR") : "…"} → ${c.endsAt ? new Date(c.endsAt).toLocaleDateString("fr-FR") : "…"}`, csv: (c) => `${c.startsAt ?? ""} ${c.endsAt ?? ""}` },
    { id: "uses", header: "Utilisations", numeric: true, sort: (c) => c.usedCount, cell: (c) => `${c.usedCount}${c.maxUses ? ` / ${c.maxUses}` : ""}` },
    { id: "state", header: "État", sort: (c) => couponState(c).label, csv: (c) => couponState(c).label, cell: (c) => <Badge tone={couponState(c).tone}>{couponState(c).label}</Badge> },
    {
      id: "actions",
      header: "",
      cell: (c) => (
        <span className="flex justify-end gap-1">
          <Button size="admin" variant="ghost" onClick={() => setCoupon({ id: c.id, code: c.code, type: c.type, value: String(c.value), minimum: c.minimum ? String(c.minimum) : "", startsAt: toLocal(c.startsAt), endsAt: toLocal(c.endsAt), maxUses: c.maxUses ? String(c.maxUses) : "" })}>Modifier</Button>
          <Button
            size="admin"
            variant="ghost"
            onClick={async () => {
              if (await confirm({ title: "Supprimer le code", message: `Le code ${c.code} sera supprimé (ou désactivé s'il a déjà servi).`, confirmLabel: "Supprimer", danger: true })) {
                saveCoupon.mutate({ path: `/admin/coupons/${c.id}`, method: "DELETE" });
              }
            }}
          >
            Supprimer
          </Button>
        </span>
      ),
    },
  ];

  const n = (s: string) => (s === "" ? null : Number(s));

  return (
    <>
      <PageHeader title="Promotions" actions={<Button size="admin" variant="accent" onClick={() => setCoupon({ code: "", type: "PERCENT", value: "", minimum: "", startsAt: "", endsAt: "", maxUses: "" })}>Nouveau code promo</Button>} />
      <div className="flex flex-col gap-6">
        <QueryState query={coupons}>{(rows) => <DataTable id="coupons" rows={rows} columns={columns} exportName="codes-promo" />}</QueryState>

        <QueryState query={sales}>
          {(rows) => (
            <Panel title="Soldes par catégorie" actions={<Button size="admin" variant="secondary" onClick={() => setSale({ name: "", categoryId: "", percent: "", startsAt: "", endsAt: "" })}>Nouvelles soldes</Button>}>
              {rows.length === 0 ? <p className="text-ink-muted">Aucune solde.</p> : (
                <ul>
                  {rows.map((s) => {
                    const active = new Date(s.startsAt) <= new Date() && new Date(s.endsAt) >= new Date();
                    return (
                      <li key={s.id} className="flex h-10 items-center gap-3 border-b border-line last:border-b-0">
                        <span className="flex-1 font-medium">{s.name}</span>
                        <span>{s.category.name}</span>
                        <span className="w-12 text-right tabular-nums">−{s.percent} %</span>
                        <span className="w-48 text-ink-muted">{new Date(s.startsAt).toLocaleDateString("fr-FR")} → {new Date(s.endsAt).toLocaleDateString("fr-FR")}</span>
                        <Badge tone={active ? "success" : "neutral"}>{active ? "En cours" : "Inactif"}</Badge>
                        <Button size="admin" variant="ghost" onClick={() => setSale({ id: s.id, name: s.name, categoryId: s.categoryId, percent: String(s.percent), startsAt: toLocal(s.startsAt), endsAt: toLocal(s.endsAt) })}>Modifier</Button>
                        <Button
                          size="admin"
                          variant="ghost"
                          onClick={async () => {
                            if (await confirm({ title: "Supprimer les soldes", message: `« ${s.name} » sera supprimée et les prix reviendront à la normale.`, confirmLabel: "Supprimer", danger: true })) {
                              saveSale.mutate({ path: `/admin/sales/${s.id}`, method: "DELETE" });
                            }
                          }}
                        >
                          Supprimer
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          )}
        </QueryState>
      </div>

      <Modal
        open={!!coupon}
        onOpenChange={(o) => !o && setCoupon(null)}
        title={coupon?.id ? "Modifier le code promo" : "Nouveau code promo"}
        footer={
          <>
            <Button size="admin" variant="ghost" onClick={() => setCoupon(null)}>Annuler</Button>
            <Button
              size="admin"
              variant="accent"
              onClick={() =>
                coupon &&
                saveCoupon.mutate(
                  {
                    path: coupon.id ? `/admin/coupons/${coupon.id}` : "/admin/coupons",
                    method: coupon.id ? "PUT" : "POST",
                    json: { code: coupon.code, type: coupon.type, value: Number(coupon.value || 0), minimum: n(coupon.minimum), startsAt: toIso(coupon.startsAt), endsAt: toIso(coupon.endsAt), maxUses: n(coupon.maxUses) },
                  },
                  { onSuccess: () => setCoupon(null) },
                )
              }
            >
              Enregistrer
            </Button>
          </>
        }
      >
        {coupon && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="cp-code" label="Code"><Input id="cp-code" density="admin" value={coupon.code} onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })} /></Field>
            <Field id="cp-type" label="Type">
              <Select id="cp-type" density="admin" value={coupon.type} onChange={(e) => setCoupon({ ...coupon, type: e.target.value as Coupon["type"] })}>
                <option value="PERCENT">Pourcentage</option>
                <option value="AMOUNT">Montant fixe</option>
                <option value="FREE_SHIPPING">Livraison offerte</option>
              </Select>
            </Field>
            {coupon.type !== "FREE_SHIPPING" && (
              <Field id="cp-value" label={coupon.type === "PERCENT" ? "Pourcentage" : "Montant (GNF)"}><Input id="cp-value" density="admin" inputMode="numeric" value={coupon.value} onChange={(e) => setCoupon({ ...coupon, value: e.target.value.replace(/\D/g, "") })} /></Field>
            )}
            <Field id="cp-min" label="Minimum d'achat (facultatif)"><Input id="cp-min" density="admin" inputMode="numeric" value={coupon.minimum} onChange={(e) => setCoupon({ ...coupon, minimum: e.target.value.replace(/\D/g, "") })} /></Field>
            <Field id="cp-start" label="Début (facultatif)"><Input id="cp-start" density="admin" type="datetime-local" value={coupon.startsAt} onChange={(e) => setCoupon({ ...coupon, startsAt: e.target.value })} /></Field>
            <Field id="cp-end" label="Fin (facultatif)"><Input id="cp-end" density="admin" type="datetime-local" value={coupon.endsAt} onChange={(e) => setCoupon({ ...coupon, endsAt: e.target.value })} /></Field>
            <Field id="cp-max" label="Utilisations max (facultatif)"><Input id="cp-max" density="admin" inputMode="numeric" value={coupon.maxUses} onChange={(e) => setCoupon({ ...coupon, maxUses: e.target.value.replace(/\D/g, "") })} /></Field>
          </div>
        )}
      </Modal>

      <Modal
        open={!!sale}
        onOpenChange={(o) => !o && setSale(null)}
        title={sale?.id ? "Modifier les soldes" : "Nouvelles soldes"}
        description="La remise s'applique à la catégorie et à ses sous-catégories ; le prix d'origine est affiché barré."
        footer={
          <>
            <Button size="admin" variant="ghost" onClick={() => setSale(null)}>Annuler</Button>
            <Button
              size="admin"
              variant="accent"
              onClick={() =>
                sale &&
                saveSale.mutate(
                  { path: sale.id ? `/admin/sales/${sale.id}` : "/admin/sales", method: sale.id ? "PUT" : "POST", json: { name: sale.name, categoryId: sale.categoryId, percent: Number(sale.percent), startsAt: toIso(sale.startsAt), endsAt: toIso(sale.endsAt) } },
                  { onSuccess: () => setSale(null) },
                )
              }
            >
              Enregistrer
            </Button>
          </>
        }
      >
        {sale && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><Field id="sl-name" label="Nom"><Input id="sl-name" density="admin" value={sale.name} onChange={(e) => setSale({ ...sale, name: e.target.value })} /></Field></div>
            <Field id="sl-cat" label="Catégorie">
              <Select id="sl-cat" density="admin" value={sale.categoryId} onChange={(e) => setSale({ ...sale, categoryId: e.target.value })}>
                <option value="">Choisir…</option>
                {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.parentId ? "— " : ""}{c.name}</option>)}
              </Select>
            </Field>
            <Field id="sl-pct" label="Remise (%)"><Input id="sl-pct" density="admin" inputMode="numeric" value={sale.percent} onChange={(e) => setSale({ ...sale, percent: e.target.value.replace(/\D/g, "") })} /></Field>
            <Field id="sl-start" label="Début"><Input id="sl-start" density="admin" type="datetime-local" value={sale.startsAt} onChange={(e) => setSale({ ...sale, startsAt: e.target.value })} /></Field>
            <Field id="sl-end" label="Fin"><Input id="sl-end" density="admin" type="datetime-local" value={sale.endsAt} onChange={(e) => setSale({ ...sale, endsAt: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </>
  );
}
