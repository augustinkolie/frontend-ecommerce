"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { api, errorMessage, fieldErrors } from "@/lib/api/browser";
import { storage, useApi, useUnsavedGuard } from "@/lib/admin/hooks";
import { DETAIL_PRESETS, FAMILY, PRODUCT_STATUS } from "@/lib/admin/labels";
import type { AdminCategory, AdminCollection, AdminProduct, AdminVariant, AttributeType } from "@/lib/admin/types";
import type { Family } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { useConfirm } from "./confirm";
import { ImageManager, type EditableImage } from "./image-manager";
import { PageHeader, Panel } from "./page";
import { useToast } from "./toast";
import { VariantMatrix } from "./variant-matrix";

type Draft = {
  name: string;
  slug: string;
  description: string;
  family: Family;
  categoryId: string;
  material: string;
  care: string;
  details: [string, string][];
  status: AdminProduct["status"];
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  collectionIds: string[];
  variants: AdminVariant[];
  images: EditableImage[];
};

const DRAFT_KEY = "admin:product:new";

function fromProduct(p: AdminProduct): Draft {
  return {
    name: p.name,
    slug: p.slug,
    description: p.description,
    family: p.family,
    categoryId: p.categoryId,
    material: p.material ?? "",
    care: p.care ?? "",
    details: Object.entries(p.details ?? {}),
    status: p.status,
    publishedAt: p.publishedAt ? p.publishedAt.slice(0, 16) : "",
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
    collectionIds: p.collections.map((c) => c.id),
    variants: p.variants.map((v) => ({ id: v.id, sku: v.sku, price: v.price, compareAtPrice: v.compareAtPrice, stock: v.stock, stockReserved: v.stockReserved, lowStockAlert: v.lowStockAlert, weightGrams: v.weightGrams, attributeValueIds: v.attributeValueIds })),
    images: p.images.map((i) => ({ key: i.id, url: i.url, alt: i.alt, colorValueId: i.colorValueId })),
  };
}

const empty = (family: Family = "CLOTHING"): Draft => ({
  name: "", slug: "", description: "", family, categoryId: "", material: "", care: "",
  details: (DETAIL_PRESETS[family] ?? []).map((k) => [k, ""]),
  status: "DRAFT", publishedAt: "", seoTitle: "", seoDescription: "", collectionIds: [], variants: [], images: [],
});

/** Création « en une page » : informations, variantes, images, SEO et publication enregistrés ensemble. */
export function ProductEditor({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const attributes = useApi<AttributeType[]>("/admin/attributes");
  const categories = useApi<AdminCategory[]>("/admin/categories");
  const collections = useApi<AdminCollection[]>("/admin/collections");

  const initial = useMemo(() => (product ? fromProduct(product) : empty()), [product]);
  const [d, setD] = useState<Draft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const restored = useRef(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  useUnsavedGuard(dirty);

  // Brouillon automatique (création) : restauré au retour sur la page.
  useEffect(() => {
    if (product || restored.current) return;
    restored.current = true;
    const saved = storage.get<Draft | null>(DRAFT_KEY, null);
    if (saved?.name) {
      // Lecture du stockage local au montage : synchronisation avec un système externe.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setD(saved);
      toast.show("Brouillon restauré.");
    }
  }, [product, toast]);
  useEffect(() => {
    if (product || !dirty) return;
    const t = setTimeout(() => storage.set(DRAFT_KEY, d), 800);
    return () => clearTimeout(t);
  }, [d, dirty, product]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const colorType = attributes.data?.find((t) => t.code === "color");
  const usedColors = (colorType?.values ?? []).filter((v) => d.variants.some((x) => x.attributeValueIds.includes(v.id)));
  const square = d.family === "LINEN";
  const slugPreview = d.slug || d.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/×/g, "x").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  async function save(statusOverride?: Draft["status"]) {
    setSaving(true);
    setErrors({});
    const body = {
      name: d.name,
      slug: d.slug || undefined,
      description: d.description,
      family: d.family,
      categoryId: d.categoryId,
      material: d.material || null,
      care: d.care || null,
      details: Object.fromEntries(d.details.filter(([k, v]) => k.trim() && v.trim())),
      status: statusOverride ?? d.status,
      publishedAt: d.publishedAt ? new Date(d.publishedAt).toISOString() : null,
      seoTitle: d.seoTitle || null,
      seoDescription: d.seoDescription || null,
      collectionIds: d.collectionIds,
      variants: d.variants.map((v) => ({ id: v.id, sku: v.sku, price: v.price, compareAtPrice: v.compareAtPrice, stock: v.stock, lowStockAlert: v.lowStockAlert, weightGrams: v.weightGrams, attributeValueIds: v.attributeValueIds })),
      images: d.images.map(({ url, alt, colorValueId }) => ({ url, alt, colorValueId })),
    };
    try {
      const saved = await api<AdminProduct>(product ? `/admin/products/${product.id}` : "/admin/products", { method: product ? "PUT" : "POST", json: body });
      storage.remove(DRAFT_KEY);
      void qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith("/admin/products") });
      toast.show(product ? "Produit enregistré." : "Produit créé.");
      if (product) setD(fromProduct(saved));
      else router.replace(`/admin/produits/${saved.id}`);
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.show(errorMessage(err), "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="pb-24"
    >
      <PageHeader
        title={product ? product.name : "Nouveau produit"}
        back={{ href: "/admin/produits", label: "Produits" }}
        description={product ? <a href={`/p/${product.slug}`} target="_blank" rel="noreferrer" className="underline">Voir sur la boutique</a> : undefined}
        actions={
          product && (
            <Button
              type="button"
              size="admin"
              variant="secondary"
              onClick={async () => {
                if (dirty && !(await confirm({ title: "Modifications non enregistrées", message: "Dupliquer sans enregistrer les modifications en cours ?" }))) return;
                try {
                  const copy = await api<AdminProduct>(`/admin/products/${product.id}/duplicate`, { method: "POST" });
                  toast.show("Produit dupliqué (brouillon).");
                  router.push(`/admin/produits/${copy.id}`);
                } catch (err) {
                  toast.show(errorMessage(err), "danger");
                }
              }}
            >
              Dupliquer
            </Button>
          )
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <Panel title="Informations">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field id="name" label="Nom" error={errors.name}>
                  <Input id="name" density="admin" value={d.name} onChange={(e) => set("name", e.target.value)} required aria-invalid={!!errors.name} autoFocus={!product} />
                </Field>
              </div>
              <Field id="family" label="Famille">
                <Select
                  id="family"
                  density="admin"
                  value={d.family}
                  onChange={(e) => {
                    const family = e.target.value as Family;
                    setD((x) => ({
                      ...x,
                      family,
                      variants: x.family === family ? x.variants : [],
                      details: x.details.some(([, v]) => v) ? x.details : (DETAIL_PRESETS[family] ?? []).map((k) => [k, ""]),
                    }));
                  }}
                >
                  {Object.entries(FAMILY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              <Field id="category" label="Catégorie" error={errors.categoryId}>
                <Select id="category" density="admin" value={d.categoryId} onChange={(e) => set("categoryId", e.target.value)} aria-invalid={!!errors.categoryId}>
                  <option value="">Choisir…</option>
                  {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.parentId ? "— " : ""}{c.name}</option>)}
                </Select>
              </Field>
              <div className="md:col-span-2">
                <Field id="description" label="Description" error={errors.description}>
                  <Textarea id="description" className="min-h-32 text-sm" value={d.description} onChange={(e) => set("description", e.target.value)} />
                </Field>
              </div>
              <Field id="material" label="Matière"><Input id="material" density="admin" value={d.material} onChange={(e) => set("material", e.target.value)} placeholder="Lin, coton, cuir…" /></Field>
              <Field id="care" label="Entretien"><Input id="care" density="admin" value={d.care} onChange={(e) => set("care", e.target.value)} /></Field>
            </div>
            <fieldset className="mt-6 flex flex-col gap-2">
              <legend className="mb-2 text-xs font-semibold tracking-caps text-ink-muted uppercase">Attributs descriptifs</legend>
              {d.details.map(([k, v], i) => (
                <div key={i} className="flex gap-2">
                  <Input density="admin" aria-label="Attribut" className="w-48" value={k} onChange={(e) => set("details", d.details.map((x, j) => (j === i ? [e.target.value, x[1]] : x)))} />
                  <Input density="admin" aria-label={`Valeur ${k}`} value={v} onChange={(e) => set("details", d.details.map((x, j) => (j === i ? [x[0], e.target.value] : x)))} />
                  <Button type="button" size="icon-admin" variant="ghost" aria-label="Retirer" onClick={() => set("details", d.details.filter((_, j) => j !== i))}>
                    <X aria-hidden size={16} strokeWidth={1.5} />
                  </Button>
                </div>
              ))}
              <Button type="button" size="admin" variant="ghost" className="self-start" onClick={() => set("details", [...d.details, ["", ""]])}>
                <Plus aria-hidden size={16} strokeWidth={1.5} /> Ajouter un attribut
              </Button>
            </fieldset>
          </Panel>

          <Panel title={`Variantes (${d.variants.length})`}>
            {attributes.data ? (
              <VariantMatrix
                key={d.family}
                family={d.family}
                attributes={attributes.data}
                variants={d.variants}
                onChange={(v) => set("variants", v)}
                skuPrefix={d.name.split(" ").map((w) => w[0] ?? "").join("") + (d.family.slice(0, 2))}
                defaultPrice={d.variants[0]?.price ?? 0}
              />
            ) : (
              <p className="text-ink-muted">Chargement des attributs…</p>
            )}
          </Panel>

          <Panel title={`Images (${d.images.length})`}>
            <ImageManager images={d.images} onChange={(imgs) => set("images", imgs)} colors={usedColors} square={square} defaultAlt={d.name} />
          </Panel>

          <Panel title="Référencement (SEO)">
            <div className="flex flex-col gap-4">
              <Field id="slug" label="Adresse (slug)" hint={`/p/${slugPreview || "…"}`}>
                <Input id="slug" density="admin" value={d.slug} onChange={(e) => set("slug", e.target.value)} placeholder={slugPreview} />
              </Field>
              <Field id="seoTitle" label={`Titre (${d.seoTitle.length}/70)`} error={errors.seoTitle}>
                <Input id="seoTitle" density="admin" maxLength={70} value={d.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder={d.name} />
              </Field>
              <Field id="seoDescription" label={`Description (${d.seoDescription.length}/170)`}>
                <Textarea id="seoDescription" className="text-sm" maxLength={170} value={d.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
              </Field>
              <div className="rounded-sm border border-line p-3">
                <p className="text-xs text-ink-muted">Aperçu dans les résultats</p>
                <p className="text-base text-focus">{d.seoTitle || d.name || "Titre du produit"}</p>
                <p className="text-xs text-success">…/p/{slugPreview}</p>
                <p className="text-sm text-ink-muted">{(d.seoDescription || d.description).slice(0, 160)}</p>
              </div>
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Publication">
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">Statut</legend>
              {(Object.keys(PRODUCT_STATUS) as Draft["status"][]).map((s) => (
                <label key={s} className={cn("flex h-10 cursor-pointer items-center gap-3 rounded-sm border px-3", d.status === s ? "border-accent" : "border-line")}>
                  <input type="radio" name="status" className="size-4 accent-accent" checked={d.status === s} onChange={() => set("status", s)} />
                  {PRODUCT_STATUS[s].label}
                </label>
              ))}
            </fieldset>
            {d.status === "SCHEDULED" && (
              <div className="mt-4">
                <Field id="publishedAt" label="Date de publication" error={errors.publishedAt}>
                  <Input id="publishedAt" density="admin" type="datetime-local" value={d.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} />
                </Field>
              </div>
            )}
          </Panel>
          <Panel title="Collections">
            {collections.data?.filter((c) => c.type === "MANUAL").length ? (
              <div className="flex flex-col gap-1">
                {collections.data.filter((c) => c.type === "MANUAL").map((c) => (
                  <label key={c.id} className="flex h-9 items-center gap-2">
                    <input
                      type="checkbox"
                      className="size-4 accent-accent"
                      checked={d.collectionIds.includes(c.id)}
                      onChange={(e) => set("collectionIds", e.target.checked ? [...d.collectionIds, c.id] : d.collectionIds.filter((x) => x !== c.id))}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-ink-muted">Aucune collection manuelle.</p>
            )}
            <p className="mt-2 text-xs text-ink-muted">Les collections automatiques se remplissent selon leurs règles.</p>
          </Panel>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-end gap-2 border-t border-line bg-surface px-4 py-3 lg:left-60">
        {dirty && <span className="mr-auto text-xs text-warning">Modifications non enregistrées</span>}
        {!product && dirty && (
          <Button
            type="button"
            size="admin"
            variant="ghost"
            onClick={async () => {
              if (!(await confirm({ title: "Abandonner le brouillon", message: "Les informations saisies seront perdues.", confirmLabel: "Abandonner", danger: true }))) return;
              storage.remove(DRAFT_KEY);
              setD(empty());
            }}
          >
            Abandonner
          </Button>
        )}
        <Button type="submit" size="admin" variant={d.status === "PUBLISHED" ? "secondary" : "accent"} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {d.status !== "PUBLISHED" && (
          <Button type="button" size="admin" variant="secondary" disabled={saving} onClick={() => void save("PUBLISHED")}>Enregistrer et publier</Button>
        )}
      </div>
    </form>
  );
}
