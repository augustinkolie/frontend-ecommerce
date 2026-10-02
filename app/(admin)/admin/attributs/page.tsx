"use client";

import { useState } from "react";
import { useConfirm } from "@/components/admin/confirm";
import { PageHeader, Panel, QueryState } from "@/components/admin/page";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { useApi, useApiMutation } from "@/lib/admin/hooks";
import { FAMILY } from "@/lib/admin/labels";
import type { AttributeType, AttributeValue } from "@/lib/admin/types";

type ValueDraft = { id?: string; typeId: string; value: string; hex: string; position: number };
type TypeDraft = { id?: string; code: string; name: string; families: string[]; position: number };

/** Tailles, pointures, dimensions, couleurs (avec code hex) : configurables sans code. */
export default function AttributesPage() {
  const query = useApi<AttributeType[]>("/admin/attributes");
  const save = useApiMutation(["/admin/attributes"], "Attribut enregistré");
  const confirm = useConfirm();
  const [value, setValue] = useState<ValueDraft | null>(null);
  const [type, setType] = useState<TypeDraft | null>(null);

  return (
    <>
      <PageHeader title="Attributs" description="Valeurs proposées dans la matrice de variantes et les filtres de la boutique." actions={<Button size="admin" variant="accent" onClick={() => setType({ code: "", name: "", families: [], position: 0 })}>Nouvel attribut</Button>} />
      <QueryState query={query}>
        {(types) => (
          <div className="grid gap-4 xl:grid-cols-2">
            {types.map((t) => (
              <Panel
                key={t.id}
                title={`${t.name} (${t.values.length})`}
                actions={
                  <div className="flex gap-1">
                    <Button size="admin" variant="ghost" onClick={() => setType({ id: t.id, code: t.code, name: t.name, families: t.families, position: t.position })}>Modifier</Button>
                    <Button size="admin" variant="secondary" onClick={() => setValue({ typeId: t.id, value: "", hex: "", position: t.values.length })}>Ajouter une valeur</Button>
                  </div>
                }
              >
                <p className="mb-3 text-xs text-ink-muted">Code « {t.code} » · Familles : {t.families.map((f) => FAMILY[f]).join(", ") || "aucune"}</p>
                <ul className="flex flex-wrap gap-2">
                  {t.values.map((v: AttributeValue) => (
                    <li key={v.id} className="inline-flex h-8 items-center gap-2 rounded-sm border border-line pl-2 text-sm">
                      {v.hex && <span aria-hidden className="size-4 rounded-full border border-line" style={{ backgroundColor: v.hex }} />}
                      <button type="button" className="hover:underline" onClick={() => setValue({ id: v.id, typeId: t.id, value: v.value, hex: v.hex ?? "", position: v.position })}>{v.value}</button>
                      <span className="text-xs text-ink-muted tabular-nums">{v._count?.variants ?? 0}</span>
                      <button
                        type="button"
                        aria-label={`Supprimer ${v.value}`}
                        className="inline-flex h-full w-7 items-center justify-center text-ink-muted hover:text-danger"
                        onClick={async () => {
                          if (await confirm({ title: "Supprimer la valeur", message: `« ${v.value} » sera supprimée (impossible si utilisée par une variante).`, confirmLabel: "Supprimer", danger: true })) {
                            save.mutate({ path: `/admin/attribute-values/${v.id}`, method: "DELETE" });
                          }
                        }}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
        )}
      </QueryState>

      <Modal
        open={!!value}
        onOpenChange={(o) => !o && setValue(null)}
        title={value?.id ? "Modifier la valeur" : "Nouvelle valeur"}
        footer={
          <>
            <Button size="admin" variant="ghost" onClick={() => setValue(null)}>Annuler</Button>
            <Button
              size="admin"
              variant="accent"
              onClick={() =>
                value &&
                save.mutate(
                  { path: value.id ? `/admin/attribute-values/${value.id}` : `/admin/attributes/${value.typeId}/values`, method: value.id ? "PUT" : "POST", json: { value: value.value, hex: value.hex || null, position: value.position } },
                  { onSuccess: () => setValue(null) },
                )
              }
            >
              Enregistrer
            </Button>
          </>
        }
      >
        {value && (
          <div className="flex flex-col gap-4">
            <Field id="v-value" label="Valeur"><Input id="v-value" density="admin" value={value.value} onChange={(e) => setValue({ ...value, value: e.target.value })} placeholder="M, 42, 160×200, Sable…" /></Field>
            <Field id="v-hex" label="Couleur (#RRGGBB, couleurs uniquement)">
              <div className="flex items-center gap-2">
                <input type="color" aria-label="Choisir la couleur" value={value.hex || "#ffffff"} onChange={(e) => setValue({ ...value, hex: e.target.value.toUpperCase() })} className="h-9 w-12 rounded-sm border border-line" />
                <Input id="v-hex" density="admin" value={value.hex} onChange={(e) => setValue({ ...value, hex: e.target.value })} placeholder="#D8C7A8" />
              </div>
            </Field>
            <Field id="v-pos" label="Ordre d'affichage"><Input id="v-pos" density="admin" inputMode="numeric" value={value.position} onChange={(e) => setValue({ ...value, position: Number(e.target.value) || 0 })} /></Field>
          </div>
        )}
      </Modal>

      <Modal
        open={!!type}
        onOpenChange={(o) => !o && setType(null)}
        title={type?.id ? "Modifier l'attribut" : "Nouvel attribut"}
        footer={
          <>
            <Button size="admin" variant="ghost" onClick={() => setType(null)}>Annuler</Button>
            <Button
              size="admin"
              variant="accent"
              onClick={() =>
                type &&
                save.mutate(
                  { path: type.id ? `/admin/attributes/${type.id}` : "/admin/attributes", method: type.id ? "PUT" : "POST", json: { code: type.code, name: type.name, families: type.families, position: type.position } },
                  { onSuccess: () => setType(null) },
                )
              }
            >
              Enregistrer
            </Button>
          </>
        }
      >
        {type && (
          <div className="flex flex-col gap-4">
            <Field id="t-name" label="Nom"><Input id="t-name" density="admin" value={type.name} onChange={(e) => setType({ ...type, name: e.target.value })} /></Field>
            <Field id="t-code" label="Code technique" hint="Minuscules et _ (ex. size, color, matiere)."><Input id="t-code" density="admin" value={type.code} onChange={(e) => setType({ ...type, code: e.target.value })} disabled={!!type.id} /></Field>
            <fieldset className="flex flex-col gap-1">
              <legend className="mb-1 text-sm font-medium">Attribut de variante pour</legend>
              {Object.entries(FAMILY).map(([k, v]) => (
                <label key={k} className="flex h-8 items-center gap-2">
                  <input type="checkbox" className="size-4 accent-accent" checked={type.families.includes(k)} onChange={(e) => setType({ ...type, families: e.target.checked ? [...type.families, k] : type.families.filter((f) => f !== k) })} />
                  {v}
                </label>
              ))}
            </fieldset>
          </div>
        )}
      </Modal>
    </>
  );
}
