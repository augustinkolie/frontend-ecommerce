"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { api, errorMessage, fieldErrors } from "@/lib/api/browser";
import type { Address } from "@/lib/api/types";

type Draft = Omit<Address, "id" | "line2"> & { id?: string; line2: string };
const empty: Draft = { name: "", line1: "", line2: "", city: "", country: "Guinée", phone: "", isDefault: false };

function AddressForm({ initial, onDone }: { initial: Draft; onDone: () => void }) {
  const [d, setD] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof Draft, v: string | boolean) => setD((x) => ({ ...x, [k]: v }));
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const { id, ...body } = d;
          await api(id ? `/me/addresses/${id}` : "/me/addresses", { method: id ? "PATCH" : "POST", json: { ...body, line2: body.line2 || undefined } });
          onDone();
        } catch (err) {
          setErrors(fieldErrors(err));
          setError(errorMessage(err));
        }
      }}
    >
      <Field id="a-name" label="Nom" error={errors.name}><Input id="a-name" autoComplete="name" value={d.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field id="a-line1" label="Adresse" error={errors.line1}><Input id="a-line1" autoComplete="address-line1" value={d.line1} onChange={(e) => set("line1", e.target.value)} /></Field>
      <Field id="a-line2" label="Complément"><Input id="a-line2" autoComplete="address-line2" value={d.line2} onChange={(e) => set("line2", e.target.value)} /></Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="a-city" label="Ville" error={errors.city}><Input id="a-city" autoComplete="address-level2" value={d.city} onChange={(e) => set("city", e.target.value)} /></Field>
        <Field id="a-phone" label="Téléphone" error={errors.phone}><Input id="a-phone" type="tel" autoComplete="tel" value={d.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" className="size-5 accent-ink" checked={d.isDefault} onChange={(e) => set("isDefault", e.target.checked)} />
        Adresse principale
      </label>
      {error && <Alert tone="danger" title="Enregistrement impossible">{error}</Alert>}
      <Button type="submit">Enregistrer</Button>
    </form>
  );
}

export function Addresses({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Draft | null>(null);
  const done = () => {
    setEditing(null);
    router.refresh();
  };
  return (
    <div className="flex flex-col gap-6">
      {addresses.length === 0 ? (
        <EmptyState title="Aucune adresse" description="Ajoutez une adresse pour commander plus vite." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col gap-3 rounded border border-line bg-surface p-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p>{a.name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.country}<br />{a.phone}</p>
                {a.isDefault && <Badge>Principale</Badge>}
              </div>
              <div className="flex gap-4">
                <button type="button" className="h-11 underline underline-offset-4" onClick={() => setEditing({ ...a, line2: a.line2 ?? "" })}>Modifier</button>
                <button
                  type="button"
                  className="h-11 text-ink-muted underline underline-offset-4 hover:text-danger"
                  onClick={async () => {
                    if (!confirm("Supprimer cette adresse ?")) return;
                    await api(`/me/addresses/${a.id}`, { method: "DELETE" });
                    router.refresh();
                  }}
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div>
        <Button variant="secondary" onClick={() => setEditing(empty)}>Ajouter une adresse</Button>
      </div>
      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing?.id ? "Modifier l'adresse" : "Nouvelle adresse"}>
        {editing && <AddressForm initial={editing} onDone={done} />}
      </Modal>
    </div>
  );
}
