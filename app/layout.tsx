import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { themeScript } from "@/lib/theme";

/*
 * Polices auto-hébergées (fichiers variables, sous-ensemble latin) : aucun appel à Google
 * au build ni à l'exécution, préchargées par Next et servies depuis le même domaine.
 * Fraunces : axes opsz (9–144) et wght (300–700). Instrument Sans : wght (400–700).
 */
const fraunces = localFont({
  src: "./fonts/fraunces-latin.woff2",
  variable: "--font-fraunces",
  weight: "300 700",
  display: "swap",
  fallback: ["Georgia", "serif"],
  // Police de repli aux métriques ajustées sur une serif : pas de saut de mise en page au chargement.
  adjustFontFallback: "Times New Roman",
});

const instrumentSans = localFont({
  src: "./fonts/instrument-sans-latin.woff2",
  variable: "--font-instrument-sans",
  weight: "400 700",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "Leppi — linge de maison, vêtements et chaussures",
    template: "%s · Leppi",
  },
  description: "Leppi, boutique guinéenne de linge de maison, vêtements, t-shirts et chaussures. Livraison à Conakry.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning : le script du <head> pose la classe .dark avant l'hydratation.
    <html lang="fr" className={`${fraunces.variable} ${instrumentSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-bg font-sans text-base text-ink">{children}</body>
    </html>
  );
}
