import type { Metadata } from "next";
import { CartPage } from "./cart-page";

export const metadata: Metadata = { title: "Panier", robots: { index: false } };

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 md:px-8">
      <h1 className="mb-8 font-serif text-4xl font-normal tracking-title">Panier</h1>
      <CartPage />
    </div>
  );
}
