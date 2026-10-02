import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };

export default async function RegisterPage({ searchParams }: PageProps<"/inscription">) {
  const { next } = await searchParams;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-4xl font-normal tracking-title">Créer un compte</h1>
        <p className="text-ink-muted">Suivez vos commandes, enregistrez vos adresses et vos favoris.</p>
      </div>
      <RegisterForm next={typeof next === "string" ? next : undefined} />
    </div>
  );
}
