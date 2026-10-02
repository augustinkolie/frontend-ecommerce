"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/shop/cart-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { api, errorMessage, fieldErrors } from "@/lib/api/browser";
import type { User } from "@/lib/api/types";
import { cn } from "@/lib/cn";

/** Destination sûre après connexion : chemin interne uniquement. */
export function safeNext(next: string | null | undefined, fallback = "/compte") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const { refresh } = useCart();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "danger" | "success"; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMessage(null);
    setErrors({});
    try {
      if (mode === "password") {
        const user = await api<User>("/auth/login", { method: "POST", json: { email, password } });
        await refresh();
        const dest = safeNext(next, user.role === "CUSTOMER" ? "/compte" : "/admin");
        router.push(dest);
        router.refresh();
      } else {
        await api("/auth/magic/request", { method: "POST", json: { email } });
        setMessage({ tone: "success", text: `Si un compte existe pour ${email}, un lien de connexion valable 15 minutes vient d'être envoyé.` });
        setSending(false);
      }
    } catch (err) {
      setErrors(fieldErrors(err));
      setMessage({ tone: "danger", text: errorMessage(err) });
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Mode de connexion" className="flex gap-6 border-b border-line">
        {(["password", "magic"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn("-mb-px h-11 border-b-2 text-sm font-medium", mode === m ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink")}
          >
            {m === "password" ? "Mot de passe" : "Lien par e-mail"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field id="login-email" label="E-mail" error={errors.email}>
          <Input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} />
        </Field>
        {mode === "password" && (
          <Field id="login-password" label="Mot de passe" error={errors.password}>
            <Input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} />
          </Field>
        )}
        {message && <Alert tone={message.tone} title={message.tone === "success" ? "E-mail envoyé" : "Connexion impossible"}>{message.text}</Alert>}
        <Button type="submit" fullWidth disabled={sending}>
          {sending ? "…" : mode === "password" ? "Se connecter" : "Recevoir un lien de connexion"}
        </Button>
      </form>
      <p className="text-sm text-ink-muted">
        Pas encore de compte ?{" "}
        <Link href={`/inscription${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-ink underline underline-offset-4">Créer un compte</Link>
        {next === "/commande" && (
          <>
            {" "}ou <Link href="/commande" className="text-ink underline underline-offset-4">commander en invité</Link>
          </>
        )}
      </p>
    </div>
  );
}
