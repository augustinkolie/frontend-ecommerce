"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/shop/cart-provider";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Price } from "@/components/ui/price";
import { Skeleton } from "@/components/ui/skeleton";
import { api, errorMessage, fieldErrors } from "@/lib/api/browser";
import type { Address, Cart, PublicSettings, User } from "@/lib/api/types";
import { cn } from "@/lib/cn";

type Form = {
  email: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  zoneId: string;
  paymentMethod: string;
  saveAddress: boolean;
  note: string;
};

function Steps({ step }: { step: 1 | 2 }) {
  const items = ["Coordonnées & livraison", "Paiement", "Confirmation"];
  return (
    <ol className="flex gap-4 border-b border-line pb-4 text-sm" aria-label="Étapes de la commande">
      {items.map((label, i) => (
        <li key={label} aria-current={i + 1 === step ? "step" : undefined} className={cn("flex items-center gap-2", i + 1 === step ? "text-ink" : "text-ink-muted")}>
          <span className={cn("inline-flex size-6 items-center justify-center rounded-full border text-xs tabular-nums", i + 1 === step ? "border-ink bg-ink text-on-ink" : "border-line")}>{i + 1}</span>
          <span className={cn(i + 1 !== step && "hidden sm:inline")}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

function Summary({ cart, shipping }: { cart: Cart; shipping: number }) {
  const total = Math.max(0, cart.subtotal - cart.discount + shipping);
  return (
    <aside aria-label="Votre commande" className="flex flex-col gap-4 border border-line bg-surface p-6 lg:sticky lg:top-24 lg:self-start">
      <h2 className="text-base font-semibold">Votre commande ({cart.count})</h2>
      <ul className="flex flex-col gap-3">
        {cart.items.map((l) => (
          <li key={l.id} className="flex gap-3 text-sm">
            <div className={cn("relative w-14 shrink-0 bg-surface-alt", l.family === "LINEN" ? "aspect-linen" : "aspect-product")}>
              {l.imageUrl && <Image src={l.imageUrl} alt="" fill sizes="56px" className="object-cover" />}
            </div>
            <div className="flex flex-1 flex-col">
              <span>{l.name} × {l.quantity}</span>
              <span className="text-xs text-ink-muted">{l.attributes.map((a) => a.value).join(" · ")}</span>
            </div>
            <Price amount={l.lineTotal} currency={cart.currency} size="sm" />
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between"><dt>Sous-total</dt><dd><Price amount={cart.subtotal} currency={cart.currency} size="sm" /></dd></div>
        {cart.discount > 0 && (
          <div className="flex justify-between text-accent"><dt>Remise ({cart.coupon?.code})</dt><dd className="tabular-nums">−{new Intl.NumberFormat("fr-FR").format(cart.discount)} {cart.currency}</dd></div>
        )}
        <div className="flex justify-between"><dt>Livraison</dt><dd>{shipping === 0 ? "Offerte" : <Price amount={shipping} currency={cart.currency} size="sm" />}</dd></div>
        <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd><Price amount={total} currency={cart.currency} /></dd></div>
      </dl>
    </aside>
  );
}

export function Checkout({ settings, user, addresses }: { settings: PublicSettings; user: User | null; addresses: Address[] }) {
  const { cart, refresh } = useCart();
  const router = useRouter();
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const zones = settings.shippingZones;
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<Form>({
    email: user?.email ?? "",
    name: defaultAddress?.name ?? user?.name ?? "",
    phone: defaultAddress?.phone ?? user?.phone ?? "",
    line1: defaultAddress?.line1 ?? "",
    line2: defaultAddress?.line2 ?? "",
    city: defaultAddress?.city ?? "",
    zoneId: zones[0]?.id ?? "",
    paymentMethod: settings.paymentMethods[0]?.code ?? "",
    saveAddress: !defaultAddress,
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Clé d'idempotence stable pour cette tentative de commande (évite les doubles commandes).
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const zone = zones.find((z) => z.id === form.zoneId);
  const cities = useMemo(() => [...new Set(zones.flatMap((z) => z.cities))], [zones]);

  // La ville choisit automatiquement la zone de livraison correspondante.
  function setCity(city: string) {
    const c = city.trim().toLowerCase();
    const match = c && !zone?.isPickup
      ? (zones.find((z) => !z.isPickup && z.cities.some((x) => x.toLowerCase() === c)) ?? zones.find((z) => !z.isPickup && z.cities.length === 0))
      : undefined;
    setForm((f) => ({ ...f, city, ...(match ? { zoneId: match.id } : {}) }));
  }

  if (!cart) {
    return (
      <div className="grid gap-12 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  if (cart.items.length === 0) {
    return <EmptyState title="Votre panier est vide" description="Ajoutez des articles avant de commander." action={<Link href="/" className={buttonClasses({ variant: "secondary" })}>Continuer mes achats</Link>} />;
  }

  const subtotalAfterDiscount = cart.subtotal - cart.discount;
  const threshold = zone?.freeAbove ?? settings.freeShippingThreshold;
  const shipping = !zone || zone.isPickup || cart.coupon?.type === "FREE_SHIPPING" || (threshold != null && subtotalAfterDiscount >= threshold) ? 0 : zone.price;

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "E-mail invalide";
    if (form.name.trim().length < 2) e.name = "Nom requis";
    if (form.phone.replace(/\D/g, "").length < 8) e.phone = "Téléphone requis (8 chiffres minimum)";
    if (!zone?.isPickup) {
      if (form.line1.trim().length < 2) e.line1 = "Adresse requise";
      if (form.city.trim().length < 2) e.city = "Ville requise";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function placeOrder() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api<{ orderId: string; redirectUrl: string | null }>("/checkout", {
        method: "POST",
        headers: { "idempotency-key": idempotencyKey },
        json: {
          email: form.email,
          address: { name: form.name, phone: form.phone, line1: form.line1, line2: form.line2 || undefined, city: form.city, country: "Guinée" },
          shippingZoneId: form.zoneId,
          paymentMethod: form.paymentMethod,
          saveAddress: !!user && form.saveAddress,
          note: form.note || undefined,
        },
      });
      await refresh();
      if (res.redirectUrl) window.location.assign(res.redirectUrl);
      else router.push(`/commande/confirmation?order=${res.orderId}`);
    } catch (err) {
      const f = fieldErrors(err);
      if (Object.keys(f).length) {
        setErrors(Object.fromEntries(Object.entries(f).map(([k, v]) => [k.replace("address.", ""), v])));
        setStep(1);
      }
      setSubmitError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-3">
      <div className="flex flex-col gap-8 lg:col-span-2">
        <Steps step={step} />

        {step === 1 ? (
          <form
            noValidate
            className="flex flex-col gap-8"
            onSubmit={(e) => {
              e.preventDefault();
              if (validateStep1()) {
                setStep(2);
                window.scrollTo({ top: 0 });
              }
            }}
          >
            <fieldset className="flex flex-col gap-4">
              <legend className="mb-4 font-serif text-2xl tracking-title">Coordonnées</legend>
              {!user && (
                <p className="text-sm text-ink-muted">
                  Déjà client ? <Link href="/connexion?next=/commande" className="text-ink underline underline-offset-4">Connectez-vous</Link>. Sinon, commandez en invité.
                </p>
              )}
              <Field id="email" label="E-mail" error={errors.email}>
                <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field id="name" label="Nom complet" error={errors.name}>
                  <Input id="name" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} />
                </Field>
                <Field id="phone" label="Téléphone" hint="Le livreur vous appellera." error={errors.phone}>
                  <Input id="phone" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={!!errors.phone} />
                </Field>
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-4 font-serif text-2xl tracking-title">Livraison</legend>
              {zones.map((z) => (
                <label key={z.id} className={cn("flex min-h-16 cursor-pointer items-center gap-4 rounded-sm border bg-surface px-4 py-3", form.zoneId === z.id ? "border-ink" : "border-line hover:border-ink-muted")}>
                  <input type="radio" name="zone" value={z.id} checked={form.zoneId === z.id} onChange={() => set("zoneId", z.id)} className="size-5 accent-ink" />
                  <span className="flex flex-1 flex-col">
                    <span className="text-sm font-medium">{z.name}</span>
                    {z.delay && <span className="text-xs text-ink-muted">{z.delay}</span>}
                  </span>
                  <span className="text-sm tabular-nums">{z.isPickup || z.price === 0 ? "Gratuit" : <Price amount={z.price} currency={cart.currency} size="sm" />}</span>
                </label>
              ))}
            </fieldset>

            {!zone?.isPickup && (
              <fieldset className="flex flex-col gap-4">
                <legend className="sr-only">Adresse de livraison</legend>
                {addresses.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {addresses.map((a) => (
                      <button key={a.id} type="button" onClick={() => setForm((f) => ({ ...f, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, saveAddress: false }))} className="h-9 rounded-sm border border-line bg-surface px-3 text-sm hover:border-ink">
                        {a.line1}, {a.city}
                      </button>
                    ))}
                  </div>
                )}
                <Field id="line1" label="Adresse" hint="Quartier, rue, repère (ex. près de la mosquée)" error={errors.line1}>
                  <Input id="line1" autoComplete="address-line1" value={form.line1} onChange={(e) => set("line1", e.target.value)} aria-invalid={!!errors.line1} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field id="line2" label="Complément (facultatif)">
                    <Input id="line2" autoComplete="address-line2" value={form.line2} onChange={(e) => set("line2", e.target.value)} />
                  </Field>
                  <Field id="city" label="Ville ou commune" error={errors.city}>
                    <Input id="city" list="cities" autoComplete="address-level2" value={form.city} onChange={(e) => setCity(e.target.value)} aria-invalid={!!errors.city} />
                  </Field>
                  <datalist id="cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
                </div>
                {user && (
                  <label className="flex min-h-11 items-center gap-3 text-sm">
                    <input type="checkbox" checked={form.saveAddress} onChange={(e) => set("saveAddress", e.target.checked)} className="size-5 accent-ink" />
                    Enregistrer cette adresse dans mon compte
                  </label>
                )}
              </fieldset>
            )}

            <Field id="note" label="Instructions de livraison (facultatif)">
              <Textarea id="note" value={form.note} onChange={(e) => set("note", e.target.value)} maxLength={500} />
            </Field>

            {submitError && <Alert tone="danger" title="Commande impossible">{submitError}</Alert>}
            <Button type="submit" fullWidth>Continuer vers le paiement</Button>
          </form>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2 border border-line bg-surface p-4 text-sm">
              <div className="flex justify-between gap-4">
                <p>
                  <span className="font-medium">{form.name}</span> · {form.phone}
                  <br />
                  {zone?.isPickup ? zone.name : `${form.line1}${form.line2 ? `, ${form.line2}` : ""}, ${form.city}`}
                  <br />
                  <span className="text-ink-muted">{form.email} · {zone?.name}</span>
                </p>
                <button type="button" onClick={() => setStep(1)} className="h-11 shrink-0 self-start underline underline-offset-4">Modifier</button>
              </div>
            </div>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-4 font-serif text-2xl tracking-title">Paiement</legend>
              {settings.paymentMethods.map((m) => (
                <label key={m.code} className={cn("flex min-h-16 cursor-pointer items-center gap-4 rounded-sm border bg-surface px-4 py-3", form.paymentMethod === m.code ? "border-ink" : "border-line hover:border-ink-muted")}>
                  <input type="radio" name="payment" value={m.code} checked={form.paymentMethod === m.code} onChange={() => set("paymentMethod", m.code)} className="size-5 accent-ink" />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium">{m.label}</span>
                    <span className="text-xs text-ink-muted">
                      {m.code === "cash_on_delivery" ? "Réglez en espèces ou par mobile money à la réception." : m.code === "test_card" ? "Paiement simulé pour la recette." : "Vous recevrez une demande de paiement sur votre téléphone."}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>

            <p className="text-xs text-ink-muted">
              En validant, vous acceptez nos <Link href="/cgv" className="underline">conditions générales de vente</Link>. Les articles sont réservés 15 minutes pendant le paiement.
            </p>
            {submitError && <Alert tone="danger" title="Commande impossible">{submitError}</Alert>}
            <Button fullWidth onClick={() => void placeOrder()} disabled={submitting}>
              {submitting ? "Validation…" : form.paymentMethod === "cash_on_delivery" ? "Confirmer la commande" : "Payer"}
            </Button>
          </div>
        )}
      </div>
      <Summary cart={cart} shipping={shipping} />
    </div>
  );
}
