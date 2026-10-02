"use client";

import { useState } from "react";
import { useConfirm } from "@/components/admin/confirm";
import { PageHeader, Panel, QueryState } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { useApi, useApiMutation, useUnsavedGuard } from "@/lib/admin/hooks";
import type { ShopSettings } from "@/lib/admin/types";
import type { ShippingZone } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";

function SettingsForm({ settings }: { settings: ShopSettings }) {
  const [s, setS] = useState(settings);
  const [prev, setPrev] = useState(settings);
  if (prev !== settings) {
    setPrev(settings);
    setS(settings);
  }
  const save = useApiMutation(["/admin/settings", "/settings"], "Paramètres enregistrés");
  const dirty = JSON.stringify(s) !== JSON.stringify(settings);
  useUnsavedGuard(dirty);
  const set = <K extends keyof ShopSettings>(k: K, v: ShopSettings[K]) => setS((x) => ({ ...x, [k]: v }));

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate({ path: "/admin/settings", method: "PUT", json: s });
      }}
    >
      <Panel title="Boutique">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="s-name" label="Nom de la boutique"><Input id="s-name" density="admin" value={s.shopName} onChange={(e) => set("shopName", e.target.value)} /></Field>
          <Field id="s-currency" label="Devise" hint="Changer de devise ne convertit pas les prix existants.">
            <Select id="s-currency" density="admin" value={s.currency} onChange={(e) => set("currency", e.target.value)}>
              <option value="GNF">Franc guinéen (GNF)</option>
              <option value="XOF">Franc CFA (XOF)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="USD">Dollar (USD)</option>
            </Select>
          </Field>
          <Field id="s-email" label="E-mail de contact"><Input id="s-email" density="admin" type="email" value={s.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} /></Field>
          <Field id="s-phone" label="Téléphone"><Input id="s-phone" density="admin" value={s.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} /></Field>
          <div className="md:col-span-2"><Field id="s-address" label="Adresse"><Input id="s-address" density="admin" value={s.address} onChange={(e) => set("address", e.target.value)} /></Field></div>
        </div>
      </Panel>

      <Panel title="Taxes et livraison">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="s-tax" label="TVA (%)" hint="Prix affichés toutes taxes comprises.">
            <Input id="s-tax" density="admin" inputMode="decimal" value={s.taxRate / 10} onChange={(e) => set("taxRate", Math.round(Number(e.target.value.replace(",", ".")) * 10) || 0)} />
          </Field>
          <Field id="s-free" label="Livraison offerte dès (vide = jamais)">
            <Input id="s-free" density="admin" inputMode="numeric" value={s.freeShippingThreshold ?? ""} onChange={(e) => set("freeShippingThreshold", e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null)} />
          </Field>
        </div>
      </Panel>

      <Panel title="Moyens de paiement">
        <ul className="flex flex-col gap-2">
          {s.paymentMethods.map((m, i) => (
            <li key={m.code} className="flex items-center gap-3">
              <input
                type="checkbox"
                aria-label={`Activer ${m.label}`}
                className="size-4 accent-accent"
                checked={m.enabled}
                onChange={(e) => set("paymentMethods", s.paymentMethods.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))}
              />
              <Input density="admin" aria-label={`Libellé ${m.code}`} className="max-w-xs" value={m.label} onChange={(e) => set("paymentMethods", s.paymentMethods.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <span className="text-xs text-ink-muted">{m.code}</span>
              {["orange_money", "mtn_momo"].includes(m.code) && <span className="text-xs text-ink-muted">Identifiants marchands requis côté serveur.</span>}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="E-mails automatiques">
        <div className="flex flex-col gap-1">
          {([["abandonedCart", "Relance panier abandonné (J+1)"], ["reviewRequest", "Demande d'avis (J+7 après livraison)"], ["backInStock", "Alerte retour en stock"]] as const).map(([k, l]) => (
            <label key={k} className="flex h-9 items-center gap-2">
              <input type="checkbox" className="size-4 accent-accent" checked={s.emails[k]} onChange={(e) => set("emails", { ...s.emails, [k]: e.target.checked })} />
              {l}
            </label>
          ))}
          <p className="text-xs text-ink-muted">Les e-mails de confirmation, d&apos;expédition et de livraison sont toujours envoyés.</p>
        </div>
      </Panel>

      <div className="flex items-center justify-end gap-2">
        {dirty && <span className="mr-auto text-xs text-warning">Modifications non enregistrées</span>}
        <Button type="submit" size="admin" variant="accent" disabled={!dirty || save.isPending}>Enregistrer</Button>
      </div>
    </form>
  );
}

type ZoneDraft = { id?: string; name: string; cities: string; price: string; freeAbove: string; isPickup: boolean; delay: string; position: number; active: boolean };

function Zones({ zones }: { zones: (ShippingZone & { position: number; active: boolean })[] }) {
  const [edit, setEdit] = useState<ZoneDraft | null>(null);
  const save = useApiMutation(["/admin/shipping-zones", "/settings"], "Zone enregistrée");
  const confirm = useConfirm();
  return (
    <Panel title="Zones et tarifs de livraison" actions={<Button size="admin" variant="secondary" onClick={() => setEdit({ name: "", cities: "", price: "", freeAbove: "", isPickup: false, delay: "", position: zones.length, active: true })}>Nouvelle zone</Button>}>
      <ul>
        {zones.map((z) => (
          <li key={z.id} className="flex min-h-10 items-center gap-3 border-b border-line py-1 last:border-b-0">
            <span className="flex-1"><span className="font-medium">{z.name}</span>{z.cities.length > 0 && <span className="text-xs text-ink-muted"> · {z.cities.join(", ")}</span>}</span>
            {z.isPickup && <Badge>Retrait</Badge>}
            {!z.active && <Badge tone="neutral">Inactive</Badge>}
            <span className="w-28 text-right tabular-nums">{z.price ? formatPrice(z.price) : "Gratuit"}</span>
            <Button size="admin" variant="ghost" onClick={() => setEdit({ id: z.id, name: z.name, cities: z.cities.join(", "), price: String(z.price), freeAbove: z.freeAbove ? String(z.freeAbove) : "", isPickup: z.isPickup, delay: z.delay ?? "", position: z.position, active: z.active })}>Modifier</Button>
            <Button
              size="admin"
              variant="ghost"
              onClick={async () => {
                if (await confirm({ title: "Supprimer la zone", message: `« ${z.name} » sera supprimée (désactivée si déjà utilisée).`, confirmLabel: "Supprimer", danger: true })) save.mutate({ path: `/admin/shipping-zones/${z.id}`, method: "DELETE" });
              }}
            >
              Supprimer
            </Button>
          </li>
        ))}
      </ul>
      <Modal
        open={!!edit}
        onOpenChange={(o) => !o && setEdit(null)}
        title={edit?.id ? "Modifier la zone" : "Nouvelle zone"}
        footer={
          <>
            <Button size="admin" variant="ghost" onClick={() => setEdit(null)}>Annuler</Button>
            <Button
              size="admin"
              variant="accent"
              onClick={() =>
                edit &&
                save.mutate(
                  {
                    path: edit.id ? `/admin/shipping-zones/${edit.id}` : "/admin/shipping-zones",
                    method: edit.id ? "PUT" : "POST",
                    json: { name: edit.name, cities: edit.cities.split(",").map((c) => c.trim()).filter(Boolean), price: Number(edit.price || 0), freeAbove: edit.freeAbove ? Number(edit.freeAbove) : null, isPickup: edit.isPickup, delay: edit.delay || null, position: edit.position, active: edit.active },
                  },
                  { onSuccess: () => setEdit(null) },
                )
              }
            >
              Enregistrer
            </Button>
          </>
        }
      >
        {edit && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><Field id="z-name" label="Nom"><Input id="z-name" density="admin" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field></div>
            <div className="md:col-span-2"><Field id="z-cities" label="Villes couvertes (séparées par des virgules)" hint="Vide : reste du pays."><Input id="z-cities" density="admin" value={edit.cities} onChange={(e) => setEdit({ ...edit, cities: e.target.value })} /></Field></div>
            <Field id="z-price" label="Tarif"><Input id="z-price" density="admin" inputMode="numeric" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value.replace(/\D/g, "") })} /></Field>
            <Field id="z-free" label="Offerte dès (facultatif)"><Input id="z-free" density="admin" inputMode="numeric" value={edit.freeAbove} onChange={(e) => setEdit({ ...edit, freeAbove: e.target.value.replace(/\D/g, "") })} /></Field>
            <Field id="z-delay" label="Délai affiché"><Input id="z-delay" density="admin" value={edit.delay} onChange={(e) => setEdit({ ...edit, delay: e.target.value })} placeholder="24 à 48 h" /></Field>
            <Field id="z-pos" label="Ordre"><Input id="z-pos" density="admin" inputMode="numeric" value={edit.position} onChange={(e) => setEdit({ ...edit, position: Number(e.target.value) || 0 })} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-accent" checked={edit.isPickup} onChange={(e) => setEdit({ ...edit, isPickup: e.target.checked })} /> Retrait en magasin</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-accent" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Active</label>
          </div>
        )}
      </Modal>
    </Panel>
  );
}

export default function SettingsPage() {
  const settings = useApi<ShopSettings>("/admin/settings");
  const zones = useApi<(ShippingZone & { position: number; active: boolean })[]>("/admin/shipping-zones");
  const reindex = useApiMutation([], "Index de recherche reconstruit");
  return (
    <>
      <PageHeader title="Paramètres" actions={<Button size="admin" variant="secondary" disabled={reindex.isPending} onClick={() => reindex.mutate({ path: "/admin/search-index" })}>Réindexer la recherche</Button>} />
      <div className="grid gap-4 xl:grid-cols-2">
        <QueryState query={settings}>{(s) => <SettingsForm settings={s} />}</QueryState>
        <div>
          <QueryState query={zones}>{(z) => <Zones zones={z} />}</QueryState>
        </div>
      </div>
    </>
  );
}
