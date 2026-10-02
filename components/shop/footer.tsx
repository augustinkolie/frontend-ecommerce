import Link from "next/link";
import { Logo } from "./logo";
import { categoryHref, getCategories, getSettings } from "@/lib/shop";

export async function Footer() {
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);
  const col = "flex flex-col gap-3";
  const title = "text-xs font-semibold tracking-caps text-ink-muted uppercase";
  const link = "text-sm hover:underline hover:underline-offset-4";
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-4 md:px-8">
        <div className={col}>
          <Logo name={settings.shopName} />
          <p className="text-sm text-ink-muted">Linge de maison, vêtements et chaussures, tissés de l’héritage guinéen.</p>
          <p className="text-sm text-ink-muted">{settings.address}</p>
          <p className="text-sm text-ink-muted">
            <a href={`mailto:${settings.contactEmail}`} className="hover:underline">{settings.contactEmail}</a>
            <br />
            <a href={`tel:${settings.contactPhone.replace(/\s/g, "")}`} className="tabular-nums hover:underline">{settings.contactPhone}</a>
          </p>
        </div>
        <nav aria-label="Boutique" className={col}>
          <p className={title}>Boutique</p>
          {categories.map((c) => (
            <Link key={c.id} href={categoryHref(c)} className={link}>{c.name}</Link>
          ))}
          <Link href="/collections/nouveautes" className={link}>Nouveautés</Link>
        </nav>
        <nav aria-label="Aide" className={col}>
          <p className={title}>Aide</p>
          <Link href="/livraison" className={link}>Livraison</Link>
          <Link href="/retours" className={link}>Retours et échanges</Link>
          <Link href="/guide-des-tailles" className={link}>Guide des tailles</Link>
          <Link href="/compte" className={link}>Mon compte</Link>
        </nav>
        <nav aria-label="Informations légales" className={col}>
          <p className={title}>Informations</p>
          <Link href="/cgv" className={link}>Conditions générales de vente</Link>
          <Link href="/confidentialite" className={link}>Confidentialité</Link>
          <p className="pt-2 text-sm text-ink-muted">Paiement : {settings.paymentMethods.map((m) => m.label).join(", ")}.</p>
        </nav>
      </div>
      <p className="border-t border-line px-4 py-6 text-center text-xs text-ink-muted">
        © {new Date().getFullYear()} {settings.shopName}
      </p>
    </footer>
  );
}
