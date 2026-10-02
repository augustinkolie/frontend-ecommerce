import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Tableau compact (lignes de 40 px) pour l'admin. */
export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded border border-line bg-surface">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "h-10 border-b border-line bg-surface-alt px-3 text-left text-xs font-semibold tracking-caps text-ink-muted uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("h-10 border-b border-line last:border-b-0 hover:bg-surface-alt", className)}
      {...props}
    />
  );
}

export function Td({
  numeric,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td className={cn("px-3", numeric && "text-right tabular-nums", className)} {...props} />
  );
}
