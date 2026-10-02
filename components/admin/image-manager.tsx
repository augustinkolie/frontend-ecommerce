"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Cropper, { type Area } from "react-easy-crop";
import { closestCenter, DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/field";
import { errorMessage } from "@/lib/api/browser";
import { cropToBlob, uploadImage } from "@/lib/admin/upload";
import { cn } from "@/lib/cn";
import { useToast } from "./toast";

export type EditableImage = { key: string; url: string; alt: string; colorValueId: string | null };

function SortableImage({
  img,
  index,
  colors,
  onChange,
  onRemove,
  square,
}: {
  img: EditableImage;
  index: number;
  colors: { id: string; value: string }[];
  onChange: (patch: Partial<EditableImage>) => void;
  onRemove: () => void;
  square: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: img.key });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cn("flex flex-col gap-2 rounded border border-line bg-surface p-2", isDragging && "opacity-60")}>
      <div className={cn("relative bg-surface-alt", square ? "aspect-linen" : "aspect-product")}>
        <Image src={img.url} alt={img.alt} fill sizes="160px" className="object-cover" />
        {index === 0 && <span className="absolute top-1 left-1 rounded-sm bg-ink px-1 text-xs text-on-ink">Principale</span>}
        <button type="button" {...attributes} {...listeners} aria-label="Déplacer l'image" className="absolute top-1 right-1 inline-flex size-8 cursor-grab items-center justify-center rounded-sm bg-surface">
          <GripVertical aria-hidden size={16} strokeWidth={1.5} />
        </button>
      </div>
      <label className="sr-only" htmlFor={`alt-${img.key}`}>Texte alternatif</label>
      <Input id={`alt-${img.key}`} density="admin" placeholder="Texte alternatif" value={img.alt} onChange={(e) => onChange({ alt: e.target.value })} />
      {colors.length > 0 && (
        <>
          <label className="sr-only" htmlFor={`color-${img.key}`}>Coloris lié</label>
          <Select id={`color-${img.key}`} density="admin" value={img.colorValueId ?? ""} onChange={(e) => onChange({ colorValueId: e.target.value || null })}>
            <option value="">Tous coloris</option>
            {colors.map((c) => <option key={c.id} value={c.id}>{c.value}</option>)}
          </Select>
        </>
      )}
      <button type="button" onClick={onRemove} className="inline-flex h-8 items-center gap-1 self-start text-xs text-ink-muted hover:text-danger">
        <Trash2 aria-hidden size={14} strokeWidth={1.5} /> Retirer
      </button>
    </li>
  );
}

/** Images produit : glisser-déposer pour ajouter et ordonner, recadrage au ratio de la famille. */
export function ImageManager({
  images,
  onChange,
  colors,
  square,
  defaultAlt,
}: {
  images: EditableImage[];
  onChange: (images: EditableImage[]) => void;
  colors: { id: string; value: string }[];
  square: boolean;
  defaultAlt: string;
}) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<{ src: string; name: string }[]>([]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const current = queue[0];

  function addFiles(files: FileList | File[]) {
    const accepted = [...files].filter((f) => /^image\/(jpeg|png|webp|avif)$/.test(f.type) && f.size <= 15 * 1024 * 1024);
    if (accepted.length < [...files].length) toast.show("Formats acceptés : JPEG, PNG, WebP, AVIF (15 Mo max).", "danger");
    setQueue((q) => [...q, ...accepted.map((f) => ({ src: URL.createObjectURL(f), name: f.name }))]);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  }

  async function confirmCrop() {
    if (!current || !area) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(current.src, area);
      const url = await uploadImage(blob);
      onChange([...images, { key: url, url, alt: defaultAlt, colorValueId: null }]);
      URL.revokeObjectURL(current.src);
      setQueue((q) => q.slice(1));
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch (err) {
      toast.show(errorMessage(err), "danger");
    } finally {
      setBusy(false);
    }
  }

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const from = images.findIndex((i) => i.key === e.active.id);
    const to = images.findIndex((i) => i.key === e.over!.id);
    onChange(arrayMove(images, from, to));
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn("flex flex-col items-center justify-center gap-2 rounded border border-dashed p-6 text-center", over ? "border-accent bg-surface-alt" : "border-line")}
      >
        <ImagePlus aria-hidden size={20} strokeWidth={1.5} className="text-ink-muted" />
        <p>Glissez vos photos ici</p>
        <Button type="button" size="admin" variant="secondary" onClick={() => input.current?.click()}>Choisir des fichiers</Button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(e) => e.target.files && addFiles(e.target.files)} />
        <p className="text-xs text-ink-muted">Recadrage au format {square ? "1:1" : "4:5"}, export WebP.</p>
      </div>

      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={images.map((i) => i.key)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {images.map((img, i) => (
                <SortableImage
                  key={img.key}
                  img={img}
                  index={i}
                  colors={colors}
                  square={square}
                  onChange={(patch) => onChange(images.map((x) => (x.key === img.key ? { ...x, ...patch } : x)))}
                  onRemove={() => onChange(images.filter((x) => x.key !== img.key))}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <Modal
        open={!!current}
        onOpenChange={(o) => {
          if (!o) {
            queue.forEach((q) => URL.revokeObjectURL(q.src));
            setQueue([]);
          }
        }}
        title={`Recadrer ${current?.name ?? ""}`}
        description={queue.length > 1 ? `${queue.length - 1} autre(s) image(s) en attente` : undefined}
        footer={
          <>
            <Button size="admin" variant="ghost" onClick={() => setQueue((q) => q.slice(1))}>Ignorer</Button>
            <Button size="admin" variant="accent" onClick={() => void confirmCrop()} disabled={busy}>{busy ? "Envoi…" : "Recadrer et envoyer"}</Button>
          </>
        }
      >
        {current && (
          <div className="flex flex-col gap-3">
            <div className="relative h-96 bg-surface-alt">
              <Cropper image={current.src} crop={crop} zoom={zoom} aspect={square ? 1 : 4 / 5} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, px) => setArea(px)} />
            </div>
            <label className="flex items-center gap-3 text-sm">
              Zoom
              <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-accent" />
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
