import type { SizeTable } from "@/lib/size-guide";

export function SizeGuideTable({ guide }: { guide: SizeTable }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-muted">{guide.note}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <caption className="sr-only">Guide des tailles : {guide.title}</caption>
          <thead>
            <tr className="border-b border-line text-left text-ink-muted">
              {guide.columns.map((c) => (
                <th key={c} scope="col" className="py-2 pr-4 font-medium whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guide.rows.map((r) => (
              <tr key={r[0]} className="border-b border-line">
                {r.map((cell, i) => (
                  <td key={i} className={`py-2 pr-4 whitespace-nowrap ${i === 0 ? "font-medium" : ""}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
