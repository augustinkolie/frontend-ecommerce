import type { ReactNode } from "react";

/** État vide éditorial : titre serif, une phrase, une action. Ni carte ni icône décorative. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex max-w-md flex-col gap-4 py-12">
      <p className="font-serif text-2xl font-normal tracking-title">{title}</p>
      {description && <p className="text-base text-ink-muted">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
