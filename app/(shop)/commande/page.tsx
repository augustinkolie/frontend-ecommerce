import type { Metadata } from "next";
import { apiAuthedOrNull } from "@/lib/api/client";
import type { Address, User } from "@/lib/api/types";
import { getSettings } from "@/lib/shop";
import { Checkout } from "./checkout";

export const metadata: Metadata = { title: "Commande", robots: { index: false } };

export default async function CheckoutPage() {
  const [settings, user] = await Promise.all([getSettings(), apiAuthedOrNull<User>("/me")]);
  const addresses = user ? ((await apiAuthedOrNull<Address[]>("/me/addresses")) ?? []) : [];
  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 md:px-8">
      <h1 className="mb-8 font-serif text-4xl font-normal tracking-title">Commande</h1>
      <Checkout settings={settings} user={user} addresses={addresses} />
    </div>
  );
}
