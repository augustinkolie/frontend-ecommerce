"use client";

import { useCallback, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, Modal } from "@/components/ui/dialog";
import { Price } from "@/components/ui/price";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Tabs } from "@/components/ui/tabs";
import { Toast } from "@/components/ui/toast";
import { ColorSwatches } from "@/components/shop/color-swatch";
import { SizeSelector } from "@/components/shop/size-selector";

export function VariantDemo() {
  const [size, setSize] = useState("M");
  const [shoe, setShoe] = useState("42");
  const [sheet, setSheet] = useState("160×200");
  const [color, setColor] = useState("sable");

  return (
    <div className="flex flex-col gap-8">
      <SizeSelector
        name="taille"
        legend="Taille"
        value={size}
        onChange={setSize}
        options={["XS", "S", "M", "L", "XL", "XXL"].map((v) => ({ value: v, label: v, available: v !== "XS" && v !== "XXL" }))}
      />
      <SizeSelector
        name="pointure"
        legend="Pointure (EU)"
        value={shoe}
        onChange={setShoe}
        options={Array.from({ length: 11 }, (_, i) => String(36 + i)).map((v) => ({ value: v, label: v, available: v !== "39" }))}
      />
      <SizeSelector
        name="dimension"
        legend="Dimension"
        value={sheet}
        onChange={setSheet}
        options={["90×190", "140×190", "160×200", "180×200"].map((v) => ({ value: v, label: v, available: v !== "180×200" }))}
      />
      <ColorSwatches
        name="coloris"
        legend="Coloris"
        value={color}
        onChange={setColor}
        options={[
          { value: "sable", label: "Sable", hex: "#D8C7A8", available: true },
          { value: "ecru", label: "Écru", hex: "#F2EDE3", available: true },
          { value: "olive", label: "Olive", hex: "#6B6B45", available: true },
          { value: "marine", label: "Marine", hex: "#1F2A3C", available: true },
          { value: "noir", label: "Noir", hex: "#1C1A17", available: false },
        ]}
      />
    </div>
  );
}

export function FilterDemo() {
  return (
    <div className="flex max-w-xs flex-col">
      <Checkbox id="f-coton" label="Coton" count={42} defaultChecked />
      <Checkbox id="f-lin" label="Lin" count={18} />
      <Checkbox id="f-percale" label="Percale" count={7} />
      <Checkbox id="f-soie" label="Soie" count={0} disabled />
    </div>
  );
}

export function QuantityDemo() {
  const [qty, setQty] = useState(1);
  return <QuantityStepper value={qty} onChange={setQty} max={5} />;
}

export function OverlayDemo() {
  const [qty, setQty] = useState(2);
  return (
    <div className="flex flex-wrap gap-4">
      <Drawer
        title="Panier (2)"
        description="Récapitulatif du panier"
        trigger={
          <Button variant="secondary">
            <ShoppingBag aria-hidden size={20} strokeWidth={1.5} />
            Ouvrir le tiroir panier
          </Button>
        }
        footer={
          <div className="flex flex-col gap-4">
            <div className="flex justify-between text-sm">
              <span>Sous-total</span>
              <Price amount={450_000 * qty} size="sm" />
            </div>
            <p className="text-sm text-ink-muted">Plus que 100 000 GNF pour la livraison offerte.</p>
            <Button fullWidth>Commander</Button>
          </div>
        }
      >
        <div className="flex gap-4">
          <div className="aspect-product w-24 shrink-0 bg-surface-alt" />
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-sm">Drap housse percale de coton</p>
            <p className="text-xs text-ink-muted">160×200 · Sable</p>
            <Price amount={450_000} size="sm" />
            <QuantityStepper value={qty} onChange={setQty} />
          </div>
        </div>
      </Drawer>

      <Modal
        title="Guide des tailles"
        description="Vêtements — mesures en centimètres"
        trigger={<Button variant="ghost">Ouvrir une modale</Button>}
      >
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="border-b border-line text-left text-ink-muted">
              <th className="py-2 font-medium">Taille</th>
              <th className="py-2 font-medium">Poitrine</th>
              <th className="py-2 font-medium">Taille</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["S", "88–92", "72–76"],
              ["M", "96–100", "80–84"],
              ["L", "104–108", "88–92"],
            ].map(([s, c, w]) => (
              <tr key={s} className="border-b border-line">
                <td className="py-2">{s}</td>
                <td className="py-2">{c}</td>
                <td className="py-2">{w}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </div>
  );
}

export function TabsDemo() {
  return (
    <Tabs
      items={[
        { value: "desc", label: "Description", content: <p className="max-w-prose">Percale de coton peigné, tissage serré pour un toucher frais et mat.</p> },
        { value: "care", label: "Entretien", content: <p>Lavage 60 °C, séchage en tambour doux, repassage à température moyenne.</p> },
        { value: "reviews", label: "Avis (12)", content: <p>4,8 / 5 — avis vérifiés.</p> },
      ]}
    />
  );
}

export function ToastDemo() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const action = (
    <a href="#overlays" className="shrink-0 text-sm font-medium underline underline-offset-4">
      Voir le panier
    </a>
  );
  return (
    <div className="flex flex-col gap-4">
      <Toast inline open onClose={() => {}} message="Ajouté au panier — Chemise en lin lavé, M" action={action} />
      <div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Déclencher la notification
        </Button>
      </div>
      <Toast open={open} onClose={close} message="Ajouté au panier — Chemise en lin lavé, M" action={action} />
    </div>
  );
}
