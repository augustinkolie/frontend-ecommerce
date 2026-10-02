"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { api, errorMessage } from "@/lib/api/browser";

export function ReturnRequestForm({ orderNumber, items }: { orderNumber: number; items: { id: string; label: string; quantity: number }[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  return (
    <form
      className="flex max-w-xl flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSending(true);
        setError(null);
        try {
          await api("/me/returns", {
            method: "POST",
            json: { orderNumber, reason, items: Object.entries(selected).filter(([, q]) => q > 0).map(([orderItemId, quantity]) => ({ orderItemId, quantity })) },
          });
          router.refresh();
        } catch (err) {
          setError(errorMessage(err));
          setSending(false);
        }
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Articles à retourner</legend>
        {items.map((i) => (
          <label key={i.id} className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-5 accent-ink"
              checked={!!selected[i.id]}
              onChange={(e) => setSelected((s) => ({ ...s, [i.id]: e.target.checked ? i.quantity : 0 }))}
            />
            {i.label} (× {i.quantity})
          </label>
        ))}
      </fieldset>
      <Field id="return-reason" label="Motif">
        <Textarea id="return-reason" value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} placeholder="Taille trop grande, article différent de la photo…" />
      </Field>
      {error && <Alert tone="danger" title="Demande impossible">{error}</Alert>}
      <div>
        <Button type="submit" variant="secondary" disabled={sending || !Object.values(selected).some(Boolean)}>Demander le retour</Button>
      </div>
    </form>
  );
}
