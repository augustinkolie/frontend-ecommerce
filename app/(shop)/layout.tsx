import { CartDrawer } from "@/components/shop/cart-drawer";
import { CartProvider } from "@/components/shop/cart-provider";
import { Footer } from "@/components/shop/footer";
import { Header } from "@/components/shop/header";
import { HideOn } from "@/components/shop/hide-on";
import { WishlistProvider } from "@/components/shop/wishlist-provider";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <CartProvider>
      <WishlistProvider>
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-surface focus:p-3">
          Aller au contenu
        </a>
        <Header />
        <main id="contenu" className="min-h-dvh">
          {children}
        </main>
        <HideOn prefixes={["/compte"]}>
          <Footer />
        </HideOn>
        <CartDrawer />
      </WishlistProvider>
    </CartProvider>
  );
}
