import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type Density = "shop" | "admin";

const control =
  "w-full rounded-sm border border-line bg-surface text-ink placeholder:text-ink-muted " +
  "transition-colors duration-150 ease-out hover:border-ink-muted " +
  "focus-visible:border-ink aria-invalid:border-danger " +
  "disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-ink-muted";

const heights: Record<Density, string> = {
  shop: "h-12 px-4 text-base",
  admin: "h-9 px-3 text-sm",
};

export function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
      {children}
    </label>
  );
}

/** Libellé + champ + aide ou erreur sous le champ. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({
  density = "shop",
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { density?: Density }) {
  return <input className={cn(control, heights[density], className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-24 px-4 py-3 text-base", className)} {...props} />;
}

export function Select({
  density = "shop",
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { density?: Density }) {
  return (
    <div className="relative">
      <select
        className={cn(control, heights[density], "appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        size={20}
        strokeWidth={1.5}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
}
