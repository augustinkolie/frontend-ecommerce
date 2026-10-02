"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCart } from "@/components/shop/cart-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { api, errorMessage, fieldErrors } from "@/lib/api/browser";
import { safeNext } from "../connexion/login-form";

const schema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(120),
  email: z.email("E-mail invalide"),
  phone: z.string().trim().max(30).optional(),
  password: z.string().min(8, "8 caractères minimum"),
});
type Values = z.infer<typeof schema>;

export function RegisterForm({ next }: { next?: string }) {
  const router = useRouter();
  const { refresh } = useCart();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState } = useForm<Values>({ resolver: zodResolver(schema) });
  const { errors, isSubmitting } = formState;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await api("/auth/register", { method: "POST", json: values });
      await refresh();
      router.push(safeNext(next));
      router.refresh();
    } catch (err) {
      for (const [k, v] of Object.entries(fieldErrors(err))) setError(k as keyof Values, { message: v });
      setServerError(errorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Field id="reg-name" label="Nom complet" error={errors.name?.message}>
        <Input id="reg-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <Field id="reg-email" label="E-mail" error={errors.email?.message}>
        <Input id="reg-email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
      </Field>
      <Field id="reg-phone" label="Téléphone (facultatif)" error={errors.phone?.message}>
        <Input id="reg-phone" type="tel" autoComplete="tel" {...register("phone")} />
      </Field>
      <Field id="reg-password" label="Mot de passe" hint="8 caractères minimum." error={errors.password?.message}>
        <Input id="reg-password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
      </Field>
      {serverError && <Alert tone="danger" title="Inscription impossible">{serverError}</Alert>}
      <Button type="submit" fullWidth disabled={isSubmitting}>Créer mon compte</Button>
      <p className="text-sm text-ink-muted">
        Déjà client ? <Link href="/connexion" className="text-ink underline underline-offset-4">Se connecter</Link>
      </p>
    </form>
  );
}
