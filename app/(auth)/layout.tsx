import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CartProvider } from "@/components/shop/cart-provider";
import { Logo } from "@/components/shop/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getSettings } from "@/lib/shop";

/**
 * Pages d'authentification (connexion, inscription, lien magique) : sans navigation
 * ni pied de page, pour garder l'attention sur le formulaire. Le panier reste fourni
 * pour être fusionné à la connexion.
 */
export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col">
        <header className="flex h-16 items-center justify-between px-4 md:h-20 md:px-8">
          <Link href="/" aria-label={`${settings.shopName}, accueil`}>
            <Logo name={settings.shopName} />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle className="size-11 rounded-sm text-ink-muted hover:bg-surface-alt hover:text-ink" />
            <Link href="/" className="inline-flex h-11 items-center gap-2 text-sm text-ink-muted hover:text-ink">
              <ArrowLeft aria-hidden size={16} strokeWidth={1.5} />
              <span>Retour à la boutique</span>
            </Link>
          </div>
        </header>
        <main id="contenu" className="flex flex-1 items-start justify-center px-4 pt-8 pb-16 md:items-center md:pt-0">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </CartProvider>
  );
}
