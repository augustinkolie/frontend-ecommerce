import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/connexion">) {
  const { next } = await searchParams;
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-4xl font-normal tracking-title">Connexion</h1>
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </div>
  );
}
