"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { api, errorMessage, fieldErrors } from "@/lib/api/browser";
import { ApiRequestError } from "@/lib/api/errors";
import { cn } from "@/lib/cn";

export function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [state, setState] = useState<{ status: "idle" | "sending" | "done" | "error" | "auth"; message?: string; fields?: Record<string, string> }>({ status: "idle" });

  if (state.status === "done") {
    return <Alert tone="success" title="Merci pour votre avis">Il sera publié après modération.</Alert>;
  }
  if (state.status === "auth") {
    return (
      <p className="text-sm">
        <Link href={`/connexion?next=/p/${slug}%23avis`} className="underline underline-offset-4">Connectez-vous</Link> pour laisser un avis (achat vérifié requis).
      </p>
    );
  }

  return (
    <form
      className="flex max-w-xl flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!rating) {
          setState({ status: "error", fields: { rating: "Choisissez une note" } });
          return;
        }
        setState({ status: "sending" });
        try {
          await api(`/products/${productId}/reviews`, { method: "POST", json: { rating, text } });
          setState({ status: "done" });
        } catch (err) {
          if (err instanceof ApiRequestError && err.status === 401) setState({ status: "auth" });
          else setState({ status: "error", message: errorMessage(err), fields: fieldErrors(err) });
        }
      }}
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Votre note</legend>
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} sur 5`}
              onClick={() => setRating(n)}
              className="inline-flex size-11 items-center justify-center rounded-sm hover:bg-surface-alt"
            >
              <Star aria-hidden size={20} strokeWidth={1.5} className={cn(n <= rating ? "fill-ink text-ink" : "text-ink-muted")} />
            </button>
          ))}
        </div>
        {state.fields?.rating && <p className="text-sm text-danger">{state.fields.rating}</p>}
      </fieldset>
      <Field id="review-text" label="Votre avis" error={state.fields?.text}>
        <Textarea id="review-text" value={text} onChange={(e) => setText(e.target.value)} minLength={10} maxLength={2000} required aria-invalid={!!state.fields?.text} />
      </Field>
      {state.status === "error" && state.message && <p className="text-sm text-danger">{state.message}</p>}
      <div>
        <Button type="submit" variant="secondary" disabled={state.status === "sending"}>Publier mon avis</Button>
      </div>
    </form>
  );
}
