"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { api, errorMessage, fieldErrors } from "@/lib/api/browser";
import type { User } from "@/lib/api/types";

export function Profile({ user }: { user: User }) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ form: "profile" | "password"; tone: "success" | "danger"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <div className="flex max-w-xl flex-col gap-12">
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/me", { method: "PATCH", json: { name, phone: phone || undefined } });
            setMsg({ form: "profile", tone: "success", text: "Profil mis à jour." });
            router.refresh();
          } catch (err) {
            setErrors(fieldErrors(err));
            setMsg({ form: "profile", tone: "danger", text: errorMessage(err) });
          }
        }}
      >
        <h2 className="font-serif text-2xl font-normal tracking-title">Profil</h2>
        <Field id="p-email" label="E-mail" hint="Contactez-nous pour modifier votre e-mail.">
          <Input id="p-email" value={user.email} disabled />
        </Field>
        <Field id="p-name" label="Nom" error={errors.name}><Input id="p-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field id="p-phone" label="Téléphone" error={errors.phone}><Input id="p-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        {msg?.form === "profile" && <Alert tone={msg.tone} title={msg.text} />}
        <div><Button type="submit" variant="secondary">Enregistrer</Button></div>
      </form>

      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/me/password", { method: "POST", json: { current: current || undefined, next } });
            setCurrent("");
            setNext("");
            setMsg({ form: "password", tone: "success", text: "Mot de passe modifié." });
          } catch (err) {
            setErrors(fieldErrors(err));
            setMsg({ form: "password", tone: "danger", text: errorMessage(err) });
          }
        }}
      >
        <h2 className="font-serif text-2xl font-normal tracking-title">{user.hasPassword ? "Mot de passe" : "Définir un mot de passe"}</h2>
        {user.hasPassword && (
          <Field id="p-current" label="Mot de passe actuel" error={errors.current}>
            <Input id="p-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
        )}
        <Field id="p-next" label="Nouveau mot de passe" hint="8 caractères minimum." error={errors.next}>
          <Input id="p-next" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} minLength={8} />
        </Field>
        {msg?.form === "password" && <Alert tone={msg.tone} title={msg.text} />}
        <div><Button type="submit" variant="secondary">Modifier le mot de passe</Button></div>
      </form>
    </div>
  );
}
