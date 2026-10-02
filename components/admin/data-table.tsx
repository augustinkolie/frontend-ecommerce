"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { ArrowDown, ArrowUp, Columns3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { storage } from "@/lib/admin/hooks";
import { cn } from "@/lib/cn";
import { ADMIN_PAGE_SIZES, defaultPageSize, slicePage } from "@/lib/pagination";

/** Pagination côté serveur (voir usePagedList) ; absente, le tableau pagine lui-même ses lignes. */
export type ServerPagination = {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  pageSizes: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export type Column<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Valeur de tri (absente : colonne non triable). */
  sort?: (row: T) => string | number;
  /** Valeur exportée en CSV (par défaut : valeur de tri). */
  csv?: (row: T) => string | number | null | undefined;
  numeric?: boolean;
  /** Colonne masquée par défaut. */
  hidden?: boolean;
  className?: string;
};

function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const text = "﻿" + [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Tableau admin compact (lignes de 40 px) : tri, colonnes masquables (mémorisées),
 * sélection multiple + actions groupées, export CSV des lignes affichées,
 * pagination numérotée avec choix du nombre de lignes (serveur ou locale).
 */
export function DataTable<T extends { id: string }>({
  id,
  rows,
  columns,
  onRowClick,
  bulkActions,
  toolbar,
  exportName,
  empty,
  pagination,
  noun = "lignes",
}: {
  id: string;
  rows: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  bulkActions?: (selected: T[], clear: () => void) => ReactNode;
  toolbar?: ReactNode;
  exportName?: string;
  empty?: ReactNode;
  pagination?: ServerPagination;
  /** Nom des lignes au pluriel, pour « 1–25 sur 120 commandes ». */
  noun?: string;
}) {
  const [hidden, setHidden] = useState<string[]>(() => columns.filter((c) => c.hidden).map((c) => c.id));
  const [sort, setSort] = useState<{ col: string; dir: 1 | -1 } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [local, setLocal] = useState({ page: 1, pageSize: defaultPageSize(ADMIN_PAGE_SIZES) });

  useEffect(() => {
    // Lecture du stockage local au montage : synchronisation avec un système externe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHidden(storage.get(`table:${id}:hidden`, columns.filter((c) => c.hidden).map((c) => c.id)));
    if (!pagination) {
      const size = storage.get<number>(`pagesize:${id}`, 0);
      if ((ADMIN_PAGE_SIZES as readonly number[]).includes(size)) setLocal({ page: 1, pageSize: size });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const visible = columns.filter((c) => !hidden.includes(c.id));
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.id === sort.col);
    if (!col?.sort) return rows;
    return [...rows].sort((a, b) => {
      const x = col.sort!(a);
      const y = col.sort!(b);
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "fr", { numeric: true })) * sort.dir;
    });
  }, [rows, sort, columns]);

  // Pagination locale si le serveur ne pagine pas (listes chargées en entier).
  const localPage = slicePage(sorted, local.page, local.pageSize);
  const shown = pagination ? sorted : localPage.items;
  const pager: ServerPagination = pagination ?? {
    page: localPage.page,
    pageCount: localPage.pageCount,
    total: localPage.total,
    pageSize: local.pageSize,
    pageSizes: ADMIN_PAGE_SIZES,
    onPageChange: (page) => setLocal((l) => ({ ...l, page })),
    onPageSizeChange: (pageSize) => {
      setLocal({ page: 1, pageSize });
      storage.set(`pagesize:${id}`, pageSize);
    },
  };

  // Sélection limitée aux lignes encore présentes (dérivée, sans effet).
  const selectedRows = sorted.filter((r) => selected.has(r.id));
  const shownSelected = shown.filter((r) => selected.has(r.id));
  const allChecked = shown.length > 0 && shownSelected.length === shown.length;
  const toggleCol = (colId: string) => {
    const next = hidden.includes(colId) ? hidden.filter((h) => h !== colId) : [...hidden, colId];
    setHidden(next);
    storage.set(`table:${id}:hidden`, next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {toolbar}
        <div className="ml-auto flex items-center gap-2">
          {bulkActions && selectedRows.length > 0 && (
            <div className="flex items-center gap-2 rounded-sm border border-accent px-2">
              <span className="text-xs tabular-nums">{selectedRows.length} sélectionné(s)</span>
              {bulkActions(selectedRows, () => setSelected(new Set()))}
            </div>
          )}
          <Dropdown.Root>
            <Dropdown.Trigger asChild>
              <Button size="admin" variant="secondary" aria-label="Colonnes affichées">
                <Columns3 aria-hidden size={16} strokeWidth={1.5} />
                Colonnes
              </Button>
            </Dropdown.Trigger>
            <Dropdown.Portal>
              <Dropdown.Content align="end" sideOffset={4} className="z-50 min-w-48 rounded border border-line bg-surface p-1 text-sm text-ink">
                {columns.map((c) => (
                  <Dropdown.CheckboxItem
                    key={c.id}
                    checked={!hidden.includes(c.id)}
                    onCheckedChange={() => toggleCol(c.id)}
                    onSelect={(e) => e.preventDefault()}
                    className="flex h-9 cursor-pointer items-center gap-2 rounded-sm px-2 outline-none data-[highlighted]:bg-surface-alt"
                  >
                    <span className={cn("inline-flex size-4 items-center justify-center rounded-sm border border-ink", !hidden.includes(c.id) && "bg-ink")} aria-hidden />
                    {c.header}
                  </Dropdown.CheckboxItem>
                ))}
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
          {exportName && (
            <Button
              size="admin"
              variant="secondary"
              onClick={() =>
                downloadCsv(
                  `${exportName}.csv`,
                  visible.map((c) => c.header),
                  sorted.map((r) => visible.map((c) => (c.csv ?? c.sort)?.(r) ?? "")),
                )
              }
            >
              <Download aria-hidden size={16} strokeWidth={1.5} />
              CSV
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-line bg-surface">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {bulkActions && (
                <th scope="col" className="h-10 w-10 border-b border-line bg-surface-alt px-3">
                  <input
                    type="checkbox"
                    aria-label="Tout sélectionner"
                    className="size-4 accent-accent"
                    checked={allChecked}
                    onChange={() =>
                      setSelected((s) => {
                        const n = new Set(s);
                        for (const r of shown) {
                          if (allChecked) n.delete(r.id);
                          else n.add(r.id);
                        }
                        return n;
                      })
                    }
                  />
                </th>
              )}
              {visible.map((c) => {
                const dir = sort?.col === c.id ? sort.dir : null;
                return (
                  <th
                    key={c.id}
                    scope="col"
                    aria-sort={dir === 1 ? "ascending" : dir === -1 ? "descending" : undefined}
                    className={cn("h-10 border-b border-line bg-surface-alt px-3 text-xs font-semibold tracking-caps whitespace-nowrap text-ink-muted uppercase", c.numeric ? "text-right" : "text-left")}
                  >
                    {c.sort ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 uppercase hover:text-ink"
                        onClick={() => setSort((s) => (s?.col === c.id ? (s.dir === 1 ? { col: c.id, dir: -1 } : null) : { col: c.id, dir: 1 }))}
                      >
                        {c.header}
                        {dir === 1 && <ArrowUp aria-hidden size={12} strokeWidth={2} />}
                        {dir === -1 && <ArrowDown aria-hidden size={12} strokeWidth={2} />}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={visible.length + (bulkActions ? 1 : 0)} className="px-3 py-8 text-center text-ink-muted">
                  {empty ?? "Aucun élément."}
                </td>
              </tr>
            )}
            {shown.map((r) => (
              <tr
                key={r.id}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cn("h-10 border-b border-line last:border-b-0", onRowClick && "cursor-pointer hover:bg-surface-alt", selected.has(r.id) && "bg-surface-alt")}
              >
                {bulkActions && (
                  <td className="px-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label="Sélectionner la ligne"
                      className="size-4 accent-accent"
                      checked={selected.has(r.id)}
                      onChange={() =>
                        setSelected((s) => {
                          const n = new Set(s);
                          if (n.has(r.id)) n.delete(r.id);
                          else n.add(r.id);
                          return n;
                        })
                      }
                    />
                  </td>
                )}
                {visible.map((c) => (
                  <td key={c.id} className={cn("px-3 whitespace-nowrap", c.numeric && "text-right tabular-nums", c.className)}>
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pager.total > 0 && <Pagination density="admin" noun={noun} className="pt-1" {...pager} />}
    </div>
  );
}
