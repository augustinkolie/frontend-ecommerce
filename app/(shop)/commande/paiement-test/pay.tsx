"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api/browser";

/** Simulateur de l'opérateur de paiement (recette uniquement). */
export function TestPayment({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "sending" | "failed" | string>("idle");

  async function simulate(outcome: "succeeded" | "failed") {
    setState("sending");
    try {
      await api("/payments/test/simulate", { method: "POST", json: { orderId, outcome } });
      if (outcome === "succeeded") router.push(`/commande/confirmation?order=${orderId}`);
      else setState("failed");
    } catch (err) {
      setState(errorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {state === "failed" && <Alert tone="danger" title="Paiement refusé">Vous pouvez réessayer tant que la réservation est active (15 min).</Alert>}
      {!["idle", "sending", "failed"].includes(state) && <Alert tone="danger" title="Erreur">{state}</Alert>}
      <Button fullWidth onClick={() => void simulate("succeeded")} disabled={state === "sending"}>Payer</Button>
      <Button fullWidth variant="secondary" onClick={() => void simulate("failed")} disabled={state === "sending"}>Simuler un refus</Button>
    </div>
  );
}
