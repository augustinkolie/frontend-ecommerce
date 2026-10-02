import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** accent : action principale de l'admin (indigo). */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
export type ButtonSize = "shop" | "admin" | "icon" | "icon-admin";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium whitespace-nowrap " +
  "transition-colors duration-150 ease-out select-none " +
  "disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-on-ink hover:bg-ink-hover",
  secondary: "border border-ink bg-transparent text-ink hover:bg-surface-alt",
  ghost: "bg-transparent text-ink hover:bg-surface-alt",
  danger: "bg-danger text-on-ink hover:opacity-90",
  accent: "bg-accent text-on-ink hover:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  shop: "h-12 px-6 text-base",
  admin: "h-9 px-4 text-sm",
  icon: "size-12 shrink-0",
  "icon-admin": "size-9 shrink-0",
};

/** Classes du bouton, réutilisables sur un <Link>. */
export function buttonClasses({
  variant = "primary",
  size = "shop",
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
