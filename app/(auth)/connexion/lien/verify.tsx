"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/shop/cart-provider";
import { Alert } from "@/components/ui/alert";
import { api, errorMessage } from "@/lib/api/browser";

export function VerifyMagicLink({ token }: { token: string }) {
  const router = useRouter();
  const { refresh } = useCart();
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    api("/auth/magic/verify", { method: "POST", json: { token } })
      .then(async () => {
        await refresh();
        router.replace("/compte");
        router.refresh();
      })
      .catch((err) => setError(errorMessage(err)));
  }, [token, router, refresh]);

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="danger" title="Lien invalide">{error}</Alert>
        <Link href="/connexion" className="text-sm underline underline-offset-4">Demander un nouveau lien</Link>
      </div>
    );
  }
  return <p className="text-ink-muted" aria-live="polite">Connexion en cours…</p>;
}
