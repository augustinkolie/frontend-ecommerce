"use client";

import { useState } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useConfirm } from "@/components/admin/confirm";
import { PageHeader, Panel, QueryState } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { useApi, useApiMutation } from "@/lib/admin/hooks";
import { FAMILY } from "@/lib/admin/labels";
import type { AdminCategory, AdminCollection, AdminProductRow } from "@/lib/admin/types";
import type { Page } from "@/lib/api/types";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------- Catégories

function SortableRow({ c, depth, onEdit, onDelete }: { c: AdminCategory; depth: number; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cn("flex h-10 items-center gap-2 border-b border-line bg-surface", isDragging && "opacity-60")}>
      <span style={{ width: depth * 24 }} aria-hidden />
      <button type="button" {...attributes} {...listeners} className="inline-flex size-8 cursor-grab items-center justify-center text-ink-muted" aria-label={`Déplacer ${c.name}`}>
        <GripVertical aria-hidden size={16} strokeWidth={1.5} />
      </button>
      <span className="flex-1 font-medium">{c.name}</span>
      <span className="text-xs text-ink-muted">/{c.slug}</span>
      <span className="w-24 text-right text-xs text-ink-muted tabular-nums">{c.productCount} produit(s)</span>
      <Button size="admin" variant="ghost" onClick={onEdit}>Modifier</Button>
      <Button size="admin" variant="ghost" onClick={onDelete}>Supprimer</Button>
    </li>
  );
}

function CategoryTree({ categories }: { categories: AdminCategory[] }) {
  const [items, setItems] = useState(categories);
  const [prev, setPrev] = useState(categories);
  if (prev !== categories) {
    setPrev(categories);
    setItems(categories);
  }
  const [edit, setEdit] = useState<Partial<AdminCategory> | null>(null);
  const confirm = useConfirm();
  const save = useApiMutation(["/admin/categories"], "Catégorie enregistrée");
  const reorder = useApiMutation(["/admin/categories"], "Ordre enregistré");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const childrenOf = (parentId: string | null) => items.filter((c) => c.parentId === parentId).sort((a, b) => a.position - b.position);

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const a = items.find((c) => c.id === e.active.id)!;
    const b = items.find((c) => c.id === e.over!.id)!;
    // Réordonnancement entre frères ; changer de parent se fait via « Modifier ».
    if (a.parentId !== b.parentId) return;
    const siblings = childrenOf(a.parentId);
    const moved = arrayMove(siblings, siblings.indexOf(a), siblings.indexOf(b)).map((c, i) => ({ ...c, position: i }));
    const next = items.map((c) => moved.find((m) => m.id === c.id) ?? c);
    setItems(next);
    reorder.mutate({ path: "/admin/categories/reorder", json: { items: moved.map((m) => ({ id: m.id, parentId: m.parentId, position: m.position })) } });
  }

  const renderLevel = (parentId: string | null, depth: number) => {
    const level = childrenOf(parentId);
    return (
      <SortableContext items={level.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {level.map((c) => (
          <div key={c.id}>
            <SortableRow
              c={c}
              depth={depth}
              onEdit={() => setEdit(c)}
              onDelete={async () => {
                if (await confirm({ title: "Supprimer la catégorie", message: `« ${c.name} » sera supprimée. Elle doit être vide.`, confirmLabel: "Supprimer", danger: true })) {
                  save.mutate({ path: `/admin/categories/${c.id}`, method: "DELETE" });
                }
              }}
            />
            {renderLevel(c.id, depth + 1)}
          </div>
        ))}
      </SortableContext>
    );
  };

  return (
    <Panel title="Arborescence" actions={<Button size="admin" variant="accent" onClick={() => setEdit({ name: "", parentId: null })}>Nouvelle catégorie</Button>}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <ul className="border-t border-line">{renderLevel(null, 0)}</ul>
      </DndContext>
      <p className="mt-2 text-xs text-ink-muted">Glissez-déposez pour réordonner (au sein d&apos;un même niveau). Pour changer de parent, utilisez « Modifier ».</p>
      <Modal
        open={!!edit}
        onOpenChange={(o) => !o && setEdit(null)}
        title={edit?.id ? "Modifier la catégorie" : "Nouvelle catégorie"}
        footer={
          <>
            <Button size="admin" variant="ghost" onClick={() => setEdit(null)}>Annuler</Button>
            <Button
              size="admin"
              variant="accent"
              onClick={() =>
                save.mutate(
                  { path: edit?.id ? `/admin/categories/${edit.id}` : "/admin/categories", method: edit?.id ? "PUT" : "POST", json: { name: edit?.name, slug: edit?.slug || undefined, parentId: edit?.parentId || null, image: edit?.image ?? null } },
                  { onSuccess: () => setEdit(null) },
                )
              }
            >
              Enregistrer
            </Button>
          </>
        }
      >
        {edit && (
          <div className="flex flex-col gap-4">
            <Field id="c-name" label="Nom"><Input id="c-name" density="admin" value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field id="c-slug" label="Slug" hint="Laisser vide pour le générer depuis le nom."><Input id="c-slug" density="admin" value={edit.slug ?? ""} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /></Field>
            <Field id="c-parent" label="Catégorie parente">
              <Select id="c-parent" density="admin" value={edit.parentId ?? ""} onChange={(e) => setEdit({ ...edit, parentId: e.target.value || null })}>
                <option value="">(racine)</option>
                {items.filter((c) => c.id !== edit.id).map((c) => <option key={c.id} value={c.id}>{c.parentId ? "— " : ""}{c.name}</option>)}
              </Select>
            </Field>
          </div>
        )}
      </Modal>
    </Panel>
  );
}

// ---------------------------------------------------------------- Collections

type CollectionDraft = { id?: string; name: string; slug: string; type: "MANUAL" | "AUTO"; rules: { family?: string; material?: string; newDays?: number; minPrice?: number; maxPrice?: number }; productIds: string[] };

function CollectionEditor({ draft, onClose }: { draft: CollectionDraft; onClose: () => void }) {
  const [d, setD] = useState(draft);
  const [search, setSearch] = useState("");
  const save = useApiMutation(["/admin/collections"], "Collection enregistrée");
  const detail = useApi<{ products: { id: string; name: string }[] }>(draft.id ? `/admin/collections/${draft.id}` : null);
  const results = useApi<Page<AdminProductRow>>(search.length >= 2 ? `/admin/products?q=${encodeURIComponent(search)}&limit=10` : null);
  const [picked, setPicked] = useState<{ id: string; name: string }[]>([]);
  const [loaded, setLoaded] = useState<unknown>(null);
  if (detail.data && loaded !== detail.data) {
    setLoaded(detail.data);
    setPicked(detail.data.products);
  }
  const num = (s: string) => (s ? Number(s) : undefined);

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={d.id ? "Modifier la collection" : "Nouvelle collection"}
      footer={
        <>
          <Button size="admin" variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            size="admin"
            variant="accent"
            onClick={() =>
              save.mutate(
                { path: d.id ? `/admin/collections/${d.id}` : "/admin/collections", method: d.id ? "PUT" : "POST", json: { name: d.name, slug: d.slug || undefined, type: d.type, rules: d.type === "AUTO" ? d.rules : null, productIds: picked.map((p) => p.id) } },
                { onSuccess: onClose },
              )
            }
          >
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field id="col-name" label="Nom"><Input id="col-name" density="admin" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
        <Field id="col-slug" label="Slug"><Input id="col-slug" density="admin" value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} placeholder="généré depuis le nom" /></Field>
        <fieldset className="flex gap-4">
          <legend className="mb-2 text-sm font-medium">Type</legend>
          {(["MANUAL", "AUTO"] as const).map((t) => (
            <label key={t} className="flex items-center gap-2">
              <input type="radio" className="size-4 accent-accent" checked={d.type === t} onChange={() => setD({ ...d, type: t })} />
              {t === "MANUAL" ? "Manuelle" : "Automatique (règles)"}
            </label>
          ))}
        </fieldset>
        {d.type === "AUTO" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Field id="r-family" label="Famille">
              <Select id="r-family" density="admin" value={d.rules.family ?? ""} onChange={(e) => setD({ ...d, rules: { ...d.rules, family: e.target.value || undefined } })}>
                <option value="">Toutes</option>
                {Object.entries(FAMILY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
            <Field id="r-material" label="Matière exacte"><Input id="r-material" density="admin" value={d.rules.material ?? ""} onChange={(e) => setD({ ...d, rules: { ...d.rules, material: e.target.value || undefined } })} /></Field>
            <Field id="r-new" label="Publié depuis moins de (jours)"><Input id="r-new" density="admin" inputMode="numeric" value={d.rules.newDays ?? ""} onChange={(e) => setD({ ...d, rules: { ...d.rules, newDays: num(e.target.value) } })} /></Field>
            <Field id="r-max" label="Prix maximum"><Input id="r-max" density="admin" inputMode="numeric" value={d.rules.maxPrice ?? ""} onChange={(e) => setD({ ...d, rules: { ...d.rules, maxPrice: num(e.target.value) } })} /></Field>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Field id="col-search" label="Ajouter des produits"><Input id="col-search" density="admin" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit…" /></Field>
            {results.data && (
              <ul className="max-h-40 overflow-y-auto rounded-sm border border-line">
                {results.data.items.filter((p) => !picked.some((x) => x.id === p.id)).map((p) => (
                  <li key={p.id}><button type="button" className="flex h-9 w-full items-center px-2 text-left hover:bg-surface-alt" onClick={() => setPicked([...picked, { id: p.id, name: p.name }])}>+ {p.name}</button></li>
                ))}
              </ul>
            )}
            <ul className="flex flex-wrap gap-1">
              {picked.map((p) => (
                <li key={p.id}>
                  <button type="button" className="inline-flex h-8 items-center gap-1 rounded-sm border border-line px-2 text-xs hover:border-danger" onClick={() => setPicked(picked.filter((x) => x.id !== p.id))} aria-label={`Retirer ${p.name}`}>
                    {p.name} ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Collections({ collections }: { collections: AdminCollection[] }) {
  const [edit, setEdit] = useState<CollectionDraft | null>(null);
  const confirm = useConfirm();
  const del = useApiMutation(["/admin/collections"], "Collection supprimée");
  return (
    <Panel title="Collections" actions={<Button size="admin" variant="accent" onClick={() => setEdit({ name: "", slug: "", type: "MANUAL", rules: {}, productIds: [] })}>Nouvelle collection</Button>}>
      <ul className="border-t border-line">
        {collections.map((c) => (
          <li key={c.id} className="flex h-10 items-center gap-3 border-b border-line">
            <span className="flex-1 font-medium">{c.name}</span>
            <Badge tone={c.type === "AUTO" ? "focus" : "neutral"}>{c.type === "AUTO" ? "Automatique" : "Manuelle"}</Badge>
            <span className="w-24 text-right text-xs text-ink-muted tabular-nums">{c.type === "MANUAL" ? `${c.productCount} produit(s)` : "selon règles"}</span>
            <Button size="admin" variant="ghost" onClick={() => setEdit({ id: c.id, name: c.name, slug: c.slug, type: c.type, rules: (c.rules ?? {}) as CollectionDraft["rules"], productIds: [] })}>Modifier</Button>
            <Button
              size="admin"
              variant="ghost"
              onClick={async () => {
                if (await confirm({ title: "Supprimer la collection", message: `« ${c.name} » sera supprimée (les produits sont conservés).`, confirmLabel: "Supprimer", danger: true })) {
                  del.mutate({ path: `/admin/collections/${c.id}`, method: "DELETE" });
                }
              }}
            >
              Supprimer
            </Button>
          </li>
        ))}
      </ul>
      {edit && <CollectionEditor draft={edit} onClose={() => setEdit(null)} />}
    </Panel>
  );
}

export default function CategoriesPage() {
  const categories = useApi<AdminCategory[]>("/admin/categories");
  const collections = useApi<AdminCollection[]>("/admin/collections");
  return (
    <>
      <PageHeader title="Catégories et collections" />
      <div className="flex flex-col gap-4">
        <QueryState query={categories}>{(c) => <CategoryTree categories={c} />}</QueryState>
        <QueryState query={collections}>{(c) => <Collections collections={c} />}</QueryState>
      </div>
    </>
  );
}
