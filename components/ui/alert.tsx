import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "danger";

const tones: Record<Tone, { rule: string; label: string }> = {
  info: { rule: "border-ink", label: "text-ink" },
  success: { rule: "border-success", label: "text-success" },
  warning: { rule: "border-warning", label: "text-warning" },
  danger: { rule: "border-danger", label: "text-danger" },
};

/**
 * Message d'état éditorial : pas de boîte, un filet de 2 px en haut,
 * un libellé en petites capitales de la couleur de l'état, puis le texte.
 */
export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex flex-col gap-2 border-t-2 pt-3", t.rule, className)}
    >
      <p className={cn("text-xs font-semibold tracking-caps uppercase", t.label)}>{title}</p>
      {children && <div className="text-sm text-ink">{children}</div>}
    </div>
  );
}
