import type { Metadata } from "next";
import { Suspense } from "react";
import { getSettings } from "@/lib/shop";
import { SearchBox } from "./search-box";

export const metadata: Metadata = { title: "Recherche", robots: { index: false, follow: true } };

export default async function SearchPage() {
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 md:px-8">
      <h1 className="sr-only">Recherche</h1>
      <Suspense>
        <SearchBox currency={settings.currency} />
      </Suspense>
    </div>
  );
}
