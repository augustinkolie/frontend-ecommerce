import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowRight, Heart, Menu, Package, Search, ShoppingBag, Truck, User } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge, ORDER_STATUSES, OrderStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Price } from "@/components/ui/price";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { ProductCard, ProductCardSkeleton, type ProductCardData } from "@/components/shop/product-card";
import { StockStatus } from "@/components/shop/stock-status";
import { FilterDemo, OverlayDemo, QuantityDemo, TabsDemo, ToastDemo, VariantDemo } from "./demos";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false },
};

const shopColors = [
  { token: "bg", hex: "#F7F4EF", usage: "Fond de page (lin)", cls: "bg-bg" },
  { token: "surface", hex: "#FFFFFF", usage: "Cartes, tiroirs, modales", cls: "bg-surface" },
  { token: "surface-alt", hex: "#EFEAE2", usage: "Fond des vignettes produit", cls: "bg-surface-alt" },
  { token: "ink", hex: "#1C1A17", usage: "Texte principal, bouton principal", cls: "bg-ink" },
  { token: "ink-muted", hex: "#6B645B", usage: "Texte secondaire, labels", cls: "bg-ink-muted" },
  { token: "line", hex: "#E2DCD2", usage: "Bordures, séparateurs", cls: "bg-line" },
  { token: "accent", hex: "#B4532A", usage: "Prix soldé, badge promo, lien actif (max 5 %)", cls: "bg-accent" },
  { token: "success", hex: "#2F6B4F", usage: "En stock, paiement validé", cls: "bg-success" },
  { token: "warning", hex: "#9A6200", usage: "Stock faible", cls: "bg-warning" },
  { token: "danger", hex: "#B3261E", usage: "Erreurs, rupture", cls: "bg-danger" },
  { token: "focus", hex: "#2B4C7E", usage: "Anneau de focus clavier (2 px)", cls: "bg-focus" },
];

const typeScale = [
  { px: 64, cls: "text-5xl" },
  { px: 48, cls: "text-4xl" },
  { px: 36, cls: "text-3xl" },
  { px: 28, cls: "text-2xl" },
  { px: 22, cls: "text-xl" },
  { px: 18, cls: "text-lg" },
  { px: 16, cls: "text-base" },
  { px: 14, cls: "text-sm" },
  { px: 12, cls: "text-xs" },
];

const spacings = [
  { px: 4, cls: "w-1" },
  { px: 8, cls: "w-2" },
  { px: 12, cls: "w-3" },
  { px: 16, cls: "w-4" },
  { px: 24, cls: "w-6" },
  { px: 32, cls: "w-8" },
  { px: 48, cls: "w-12" },
  { px: 64, cls: "w-16" },
  { px: 96, cls: "w-24" },
];

const swatches = [
  { value: "Sable", hex: "#D8C7A8" },
  { value: "Écru", hex: "#EDE6D8" },
  { value: "Olive", hex: "#6B6B45" },
];

const demoProducts: ProductCardData[] = [
  { id: "1", slug: "drap-housse-percale-de-coton", name: "Drap housse percale de coton", price: 450_000, compareAtPrice: null, family: "LINEN", colors: swatches, isNew: false, inStock: true, imageUrl: null, imageAlt: null, hoverImageUrl: null },
  { id: "2", slug: "chemise-en-lin-lave", name: "Chemise en lin lavé", price: 390_000, compareAtPrice: 520_000, family: "CLOTHING", colors: swatches, isNew: false, inStock: true, imageUrl: null, imageAlt: null, hoverImageUrl: null },
  { id: "3", slug: "t-shirt-coton-bio-220-g-m", name: "T-shirt coton bio 220 g/m²", price: 150_000, compareAtPrice: null, family: "TSHIRT", colors: swatches, isNew: true, inStock: true, imageUrl: null, imageAlt: null, hoverImageUrl: null },
  { id: "4", slug: "basket-cuir-pleine-fleur", name: "Basket cuir pleine fleur", price: 890_000, compareAtPrice: null, family: "SHOES", colors: [], isNew: false, inStock: false, imageUrl: null, imageAlt: null, hoverImageUrl: null },
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex flex-col gap-6 border-t border-line py-12">
      <h2 id={`${id}-title`} className="font-serif text-2xl font-normal tracking-title">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Sub({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-semibold tracking-caps text-ink-muted uppercase">{children}</h3>;
}

export default function StyleguidePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 md:px-8">
      <header className="flex flex-col gap-4 py-12 md:py-16">
        <p className="text-xs font-semibold tracking-caps text-ink-muted uppercase">Design system · v0.1</p>
        <h1 className="font-serif text-4xl font-normal tracking-title md:text-5xl">Styleguide</h1>
        <p className="max-w-prose text-lg text-ink-muted">
          Boutique de mode éditoriale, sobre. La photo produit porte la couleur ; l&apos;interface reste
          neutre. Toutes les valeurs proviennent de <code className="text-base">styles/tokens.css</code>.
        </p>
        <nav aria-label="Sections" className="flex flex-wrap gap-x-6 gap-y-2 pt-4 text-sm">
          {[
            ["couleurs", "Couleurs"],
            ["typo", "Typographie"],
            ["formes", "Formes"],
            ["boutons", "Boutons"],
            ["champs", "Champs"],
            ["badges", "Badges"],
            ["variantes", "Variantes"],
            ["produits", "Produits"],
            ["overlays", "Tiroir & modale"],
            ["etats", "États"],
            ["icones", "Icônes"],
            ["admin", "Admin"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="underline-offset-4 hover:underline">
              {label}
            </a>
          ))}
        </nav>
      </header>

      <Section id="couleurs" title="Couleurs">
        <p className="max-w-prose text-ink-muted">
          Couleurs pleines uniquement. Aucune autre couleur n&apos;existe dans Tailwind : les palettes par défaut
          sont désactivées.
        </p>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {shopColors.map((c) => (
            <li key={c.token} className="flex flex-col gap-2">
              <div className={`h-16 rounded border border-line ${c.cls}`} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{c.token}</span>
                <span className="text-xs text-ink-muted tabular-nums">{c.hex}</span>
                <span className="text-xs text-ink-muted">{c.usage}</span>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="typo" title="Typographie">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Sub>Titres — Fraunces 400–500</Sub>
            <p className="font-serif text-4xl font-normal tracking-title">Collection Lin d&apos;été</p>
            <p className="font-serif text-2xl font-medium tracking-title">Linge de maison</p>
          </div>
          <div className="flex flex-col gap-2">
            <Sub>Texte & interface — Instrument Sans 400 · 500 · 600</Sub>
            <p className="text-base">Regular 400 — Percale de coton peigné, 80 fils/cm².</p>
            <p className="text-base font-medium">Medium 500 — Ajouter au panier</p>
            <p className="text-base font-semibold">Semibold 600 — Commande n° 10482</p>
            <p className="text-base tabular-nums">Chiffres tabulaires : 1 234,50 € · 89,00 € · 12 x</p>
          </div>
        </div>
        <Sub>Échelle</Sub>
        <ul className="flex flex-col gap-3">
          {typeScale.map((t) => (
            <li key={t.px} className="flex items-baseline gap-6 border-b border-line pb-3">
              <span className="w-12 shrink-0 text-xs text-ink-muted tabular-nums">{t.px}px</span>
              <span className={`${t.cls} truncate ${t.px >= 28 ? "font-serif tracking-title" : ""}`}>
                Drap percale sable
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="formes" title="Formes & espacement">
        <Sub>Espacements (grille de 4 px)</Sub>
        <ul className="flex flex-col gap-2">
          {spacings.map((s) => (
            <li key={s.px} className="flex items-center gap-4">
              <span className="w-12 text-xs text-ink-muted tabular-nums">{s.px}px</span>
              <span className={`h-4 bg-ink ${s.cls}`} />
            </li>
          ))}
        </ul>
        <Sub>Rayons</Sub>
        <div className="flex flex-wrap items-end gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="size-16 rounded-sm border border-ink bg-surface" />
            <span className="text-xs text-ink-muted">2 px — boutons, champs</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="size-16 rounded border border-ink bg-surface" />
            <span className="text-xs text-ink-muted">4 px — cartes, modales</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="size-6 rounded-full border border-line bg-accent" />
            <span className="text-xs text-ink-muted">999 px — pastilles uniquement</span>
          </div>
        </div>
        <p className="text-sm text-ink-muted">Aucune ombre dans la boutique : bordure 1 px « line » à la place.</p>
      </Section>

      <Section id="boutons" title="Boutons">
        <Sub>Boutique — 48 px</Sub>
        <div className="flex flex-wrap gap-4">
          <Button>Ajouter au panier</Button>
          <Button variant="secondary">Voir le guide des tailles</Button>
          <Button variant="ghost">
            <Heart aria-hidden size={20} strokeWidth={1.5} />
            Favori
          </Button>
          <Button disabled>Épuisé</Button>
        </div>
        <div className="max-w-sm">
          <Button fullWidth>
            Commander
            <ArrowRight aria-hidden size={20} strokeWidth={1.5} />
          </Button>
        </div>
        <Sub>Admin — 36 px</Sub>
        <div className="flex flex-wrap gap-2">
          <Button size="admin">Enregistrer</Button>
          <Button size="admin" variant="secondary">Dupliquer</Button>
          <Button size="admin" variant="ghost">Annuler</Button>
          <Button size="admin" variant="danger">Supprimer</Button>
        </div>
      </Section>

      <Section id="champs" title="Champs & filtres">
        <div className="grid max-w-3xl gap-6 md:grid-cols-2">
          <Field id="sg-email" label="E-mail" hint="Nous y enverrons la confirmation.">
            <Input id="sg-email" type="email" placeholder="vous@exemple.com" aria-describedby="sg-email-hint" />
          </Field>
          <Field id="sg-phone" label="Téléphone" error="Numéro invalide, 9 chiffres attendus.">
            <Input id="sg-phone" type="tel" defaultValue="62 12" aria-invalid aria-describedby="sg-phone-error" />
          </Field>
          <Field id="sg-zone" label="Zone de livraison">
            <Select id="sg-zone" defaultValue="conakry">
              <option value="conakry">Conakry</option>
              <option value="retrait">Retrait en magasin</option>
              <option value="national">Autres villes</option>
            </Select>
          </Field>
          <Field id="sg-disabled" label="Code promo (désactivé)">
            <Input id="sg-disabled" disabled placeholder="ETE30" />
          </Field>
          <div className="md:col-span-2">
            <Field id="sg-note" label="Instructions de livraison">
              <Textarea id="sg-note" placeholder="Code d'accès, étage…" />
            </Field>
          </div>
        </div>
        <Sub>Filtres à facettes</Sub>
        <FilterDemo />
        <Sub>Quantité</Sub>
        <QuantityDemo />
      </Section>

      <Section id="badges" title="Badges & prix">
        <div className="flex flex-wrap gap-2">
          <Badge tone="accent">-30 %</Badge>
          <Badge tone="ink">Nouveau</Badge>
          <Badge tone="success">En stock</Badge>
          <Badge tone="warning">Plus que 2</Badge>
          <Badge tone="danger">Rupture</Badge>
          <Badge>Bio</Badge>
        </div>
        <Sub>Statuts de commande</Sub>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((s) => (
            <OrderStatusBadge key={s} status={s} />
          ))}
        </div>
        <Sub>Prix</Sub>
        <div className="flex flex-col gap-2">
          <Price amount={8900} size="xl" />
          <Price amount={5900} compareAt={8500} size="xl" />
          <Price amount={450000} currency="GNF" size="lg" />
        </div>
      </Section>

      <Section id="variantes" title="Sélecteurs de variante">
        <VariantDemo />
      </Section>

      <Section id="produits" title="Cartes produit">
        <p className="text-sm text-ink-muted">
          Grille 2 colonnes mobile / 4 desktop. Ratio 4:5 (vêtements, chaussures), 1:1 (linge). Placeholder couleur unie.
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {demoProducts.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
        <Sub>Chargement</Sub>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton family="LINEN" />
          <ProductCardSkeleton />
        </div>
      </Section>

      <Section id="overlays" title="Tiroir, modale & onglets">
        <OverlayDemo />
        <TabsDemo />
      </Section>

      <Section id="etats" title="États">
        <p className="max-w-prose text-ink-muted">
          Pas de boîtes ni de contours colorés : la couleur d&apos;état ne touche qu&apos;un filet et un libellé.
        </p>

        <Sub>Messages</Sub>
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-4">
          <Alert tone="success" title="Paiement validé">Commande n° 10482 confirmée.</Alert>
          <Alert tone="warning" title="Stock faible">Plus que 2 articles en 160×200.</Alert>
          <Alert tone="danger" title="Paiement refusé">Votre banque a refusé la transaction.</Alert>
          <Alert title="Livraison offerte">Dès 100,00 € d&apos;achat.</Alert>
        </div>

        <Sub>Notification</Sub>
        <ToastDemo />

        <Sub>Disponibilité</Sub>
        <div className="flex flex-col gap-2">
          <StockStatus stock={24} />
          <StockStatus stock={2} />
          <StockStatus stock={0} />
        </div>

        <Sub>Chargement</Sub>
        <div className="grid max-w-3xl gap-8 md:grid-cols-2">
          <Skeleton className="aspect-product w-full" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <div className="flex gap-2 pt-6">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="size-11" />
              ))}
            </div>
            <Skeleton className="mt-6 h-12 w-full" />
          </div>
        </div>

        <Sub>État vide</Sub>
        <EmptyState
          title="Votre panier est vide"
          description="Les nouveautés de la saison vous attendent."
          action={
            <a href="#produits" className="text-base font-medium underline underline-offset-4 hover:text-ink-hover">
              Voir les nouveautés
            </a>
          }
        />
      </Section>

      <Section id="icones" title="Icônes">
        <p className="text-sm text-ink-muted">Lucide, trait 1,5 px, 20 px. Jamais d&apos;emoji, jamais dans un cercle coloré.</p>
        <div className="flex flex-wrap gap-6 text-ink">
          {[Search, User, Heart, ShoppingBag, Menu, Truck, Package, ArrowRight].map((Icon, i) => (
            <Icon key={i} aria-hidden size={20} strokeWidth={1.5} />
          ))}
        </div>
      </Section>

      <Section id="admin" title="Admin">
        <p className="max-w-prose text-sm text-ink-muted">
          Neutres plus froids (#F4F4F2), accent indigo #2B4C7E, Instrument Sans uniquement, lignes de 40 px, une seule
          ombre légère pour menus et modales. Mode sombre : fond #141412, surface #1E1D1B, texte #ECE9E4.
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
          {(["", "dark"] as const).map((mode) => (
            <div key={mode || "light"} className={`admin ${mode} flex flex-col gap-4 rounded border border-line bg-bg p-4 text-ink`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{mode ? "Mode sombre" : "Mode clair"}</p>
                <div className="flex gap-2">
                  <Button size="admin" variant="secondary">Exporter CSV</Button>
                  <button type="button" className="inline-flex h-9 items-center rounded-sm bg-accent px-4 text-sm font-medium text-on-ink">
                    Nouveau produit
                  </button>
                </div>
              </div>
              <Table>
                <thead>
                  <tr>
                    <Th>Commande</Th>
                    <Th>Statut</Th>
                    <Th className="text-right">Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["#10482", "PAID", 17800],
                    ["#10481", "PREPARING", 5900],
                    ["#10480", "SHIPPED", 24300],
                    ["#10479", "PENDING_PAYMENT", 2900],
                  ].map(([n, s, t]) => (
                    <Tr key={n as string}>
                      <Td className="font-medium tabular-nums">{n}</Td>
                      <Td>
                        <OrderStatusBadge status={s as (typeof ORDER_STATUSES)[number]} />
                      </Td>
                      <Td numeric>
                        <Price amount={t as number} size="sm" className="justify-end" />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <div className="w-56 rounded border border-line bg-surface p-1 text-sm shadow-overlay">
                {["Modifier", "Dupliquer", "Archiver"].map((a) => (
                  <div key={a} className="flex h-9 items-center rounded-sm px-3 hover:bg-surface-alt">
                    {a}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
