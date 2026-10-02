"use client";

import { useState } from "react";
import Image from "next/image";
import { useConfirm } from "@/components/admin/confirm";
import { HeroHotspotEditor } from "@/components/admin/hero-hotspot-editor";
import { PageHeader, Panel, QueryState } from "@/components/admin/page";
import { useToast } from "@/components/admin/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { errorMessage } from "@/lib/api/browser";
import { useApi, useApiMutation, useUnsavedGuard } from "@/lib/admin/hooks";
import { uploadImage } from "@/lib/admin/upload";
import type { AdminContentBlock, HeroHotspotDraft } from "@/lib/admin/types";
import type { LegalPage } from "@/lib/api/types";
import { cn } from "@/lib/cn";

const SLOTS = { home_hero: "Bandeau d'accueil", home_collection: "Collection mise en avant" } as const;

type BlockDraft = { id?: string; slot: keyof typeof SLOTS; title: string; subtitle: string; imageUrl: string; linkUrl: string; linkLabel: string; hotspots: HeroHotspotDraft[]; position: number; active: boolean };

function BlockEditor({ draft, onClose }: { draft: BlockDraft; onClose: () => void }) {
  const [d, setD] = useState(draft);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const save = useApiMutation(["/admin/content"], "Contenu enregistré");
  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={d.id ? "Modifier le bloc" : "Nouveau bloc"}
      wide={d.slot === "home_hero"}
      footer={
        <>
          <Button size="admin" variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            size="admin"
            variant="accent"
            onClick={() =>
              save.mutate(
                { path: d.id ? `/admin/content/blocks/${d.id}` : "/admin/content/blocks", method: d.id ? "PUT" : "POST", json: { slot: d.slot, title: d.title, subtitle: d.subtitle || null, imageUrl: d.imageUrl || null, linkUrl: d.linkUrl || null, linkLabel: d.linkLabel || null, ...(d.slot === "home_hero" ? { hotspots: d.hotspots.map(({ productId, x, y }) => ({ productId, x, y })) } : {}), position: d.position, active: d.active } },
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
        <Field id="b-slot" label="Emplacement">
          <Select id="b-slot" density="admin" value={d.slot} onChange={(e) => setD({ ...d, slot: e.target.value as BlockDraft["slot"] })}>
            {Object.entries(SLOTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field id="b-title" label="Titre"><Input id="b-title" density="admin" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
        <Field id="b-sub" label="Sous-titre"><Textarea id="b-sub" className="text-sm" value={d.subtitle} onChange={(e) => setD({ ...d, subtitle: e.target.value })} /></Field>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Image</span>
          {d.imageUrl && <div className="relative aspect-feature w-full max-w-xs bg-surface-alt"><Image src={d.imageUrl} alt="" fill sizes="320px" className="object-cover" /></div>}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Choisir une image"
            disabled={uploading}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setUploading(true);
              try {
                setD({ ...d, imageUrl: await uploadImage(f) });
              } catch (err) {
                toast.show(errorMessage(err), "danger");
              } finally {
                setUploading(false);
              }
            }}
            className="text-sm"
          />
        </div>
        {d.slot === "home_hero" &&
          (d.imageUrl ? (
            <HeroHotspotEditor imageUrl={d.imageUrl} value={d.hotspots} onChange={(hotspots) => setD({ ...d, hotspots })} />
          ) : (
            <p className="text-sm text-ink-muted">Ajoutez une photo pour placer les produits dessus.</p>
          ))}
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="b-link" label="Lien"><Input id="b-link" density="admin" value={d.linkUrl} onChange={(e) => setD({ ...d, linkUrl: e.target.value })} placeholder="/collections/essentiel-ete" /></Field>
          <Field id="b-label" label="Texte du lien"><Input id="b-label" density="admin" value={d.linkLabel} onChange={(e) => setD({ ...d, linkLabel: e.target.value })} /></Field>
          <Field id="b-pos" label="Ordre"><Input id="b-pos" density="admin" inputMode="numeric" value={d.position} onChange={(e) => setD({ ...d, position: Number(e.target.value) || 0 })} /></Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" className="size-4 accent-accent" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} /> Affiché
          </label>
        </div>
      </div>
    </Modal>
  );
}

function PageEditor({ page }: { page: LegalPage }) {
  const [title, setTitle] = useState(page.title);
  const [body, setBody] = useState(page.body);
  const [prev, setPrev] = useState(page);
  if (prev !== page) {
    setPrev(page);
    setTitle(page.title);
    setBody(page.body);
  }
  const save = useApiMutation(["/admin/content/pages"], "Page enregistrée");
  const dirty = title !== page.title || body !== page.body;
  useUnsavedGuard(dirty);
  return (
    <div className="flex flex-col gap-3">
      <Field id={`pg-title-${page.slug}`} label="Titre"><Input id={`pg-title-${page.slug}`} density="admin" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field id={`pg-body-${page.slug}`} label="Contenu" hint="« ## » pour un intertitre, ligne vide entre les paragraphes, « - » pour une liste.">
        <Textarea id={`pg-body-${page.slug}`} className="min-h-80 font-mono text-sm" value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <div className="flex items-center justify-end gap-2">
        {dirty && <span className="mr-auto text-xs text-warning">Modifications non enregistrées</span>}
        <a href={`/${page.slug}`} target="_blank" rel="noreferrer" className="text-sm underline">Voir la page</a>
        <Button size="admin" variant="accent" disabled={!dirty} onClick={() => save.mutate({ path: `/admin/content/pages/${page.slug}`, method: "PUT", json: { title, body } })}>Enregistrer</Button>
      </div>
    </div>
  );
}

export default function ContentPage() {
  const blocks = useApi<AdminContentBlock[]>("/admin/content/blocks");
  const pages = useApi<LegalPage[]>("/admin/content/pages");
  const del = useApiMutation(["/admin/content"], "Bloc supprimé");
  const confirm = useConfirm();
  const [edit, setEdit] = useState<BlockDraft | null>(null);
  const [pageSlug, setPageSlug] = useState("cgv");

  return (
    <>
      <PageHeader title="Contenu" description="Bandeaux d'accueil, mises en avant de collections et pages légales." />
      <div className="flex flex-col gap-4">
        <QueryState query={blocks}>
          {(rows) => (
            <Panel title="Accueil" actions={<Button size="admin" variant="accent" onClick={() => setEdit({ slot: "home_hero", title: "", subtitle: "", imageUrl: "", linkUrl: "", linkLabel: "", hotspots: [], position: rows.length, active: true })}>Nouveau bloc</Button>}>
              <ul>
                {rows.map((b) => (
                  <li key={b.id} className="flex min-h-14 items-center gap-3 border-b border-line py-2 last:border-b-0">
                    <span className="relative h-10 w-16 shrink-0 overflow-hidden rounded-sm bg-surface-alt">{b.imageUrl && <Image src={b.imageUrl} alt="" fill sizes="64px" className="object-cover" />}</span>
                    <span className="flex-1"><span className="font-medium">{b.title}</span><br /><span className="text-xs text-ink-muted">{SLOTS[b.slot as keyof typeof SLOTS] ?? b.slot} · ordre {b.position}</span></span>
                    {!b.active && <Badge>Masqué</Badge>}
                    <Button size="admin" variant="ghost" onClick={() => setEdit({ id: b.id, slot: b.slot as BlockDraft["slot"], title: b.title, subtitle: b.subtitle ?? "", imageUrl: b.imageUrl ?? "", linkUrl: b.linkUrl ?? "", linkLabel: b.linkLabel ?? "", hotspots: b.hotspots ?? [], position: b.position, active: b.active })}>Modifier</Button>
                    <Button
                      size="admin"
                      variant="ghost"
                      onClick={async () => {
                        if (await confirm({ title: "Supprimer le bloc", message: `« ${b.title} » sera retiré de l'accueil.`, confirmLabel: "Supprimer", danger: true })) del.mutate({ path: `/admin/content/blocks/${b.id}`, method: "DELETE" });
                      }}
                    >
                      Supprimer
                    </Button>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </QueryState>

        <QueryState query={pages}>
          {(rows) => {
            const page = rows.find((p) => p.slug === pageSlug) ?? rows[0];
            return (
              <Panel title="Pages légales">
                <div role="tablist" className="mb-4 flex flex-wrap gap-4 border-b border-line">
                  {rows.map((p) => (
                    <button key={p.slug} role="tab" type="button" aria-selected={page?.slug === p.slug} onClick={() => setPageSlug(p.slug)} className={cn("-mb-px h-10 border-b-2 text-sm", page?.slug === p.slug ? "border-accent font-medium" : "border-transparent text-ink-muted hover:text-ink")}>
                      {p.title}
                    </button>
                  ))}
                </div>
                {page && <PageEditor page={page} />}
              </Panel>
            );
          }}
        </QueryState>
      </div>
      {edit && <BlockEditor draft={edit} onClose={() => setEdit(null)} />}
    </>
  );
}
