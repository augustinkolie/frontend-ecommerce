import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VerifyMagicLink } from "./verify";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function MagicLinkPage({ searchParams }: PageProps<"/connexion/lien">) {
  const { token } = await searchParams;
  if (typeof token !== "string") notFound();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-4xl font-normal tracking-title">Connexion</h1>
      <VerifyMagicLink token={token} />
    </div>
  );
}
