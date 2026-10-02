import { apiAuthed } from "@/lib/api/client";
import type { Address } from "@/lib/api/types";
import { Addresses } from "./addresses";

export const metadata = { title: "Adresses" };

export default async function AddressesPage() {
  const addresses = await apiAuthed<Address[]>("/me/addresses");
  return (
    <section aria-labelledby="addr-title">
      <h2 id="addr-title" className="mb-4 font-serif text-2xl font-normal tracking-title">Adresses</h2>
      <Addresses addresses={addresses} />
    </section>
  );
}
