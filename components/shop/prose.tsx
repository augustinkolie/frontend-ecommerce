import type { ReactNode } from "react";

/** Rendu minimal du texte des pages légales : titres « ## », paragraphes, listes « - ». Aucun HTML brut. */
export function Prose({ source }: { source: string }) {
  const blocks = source.split(/\n{2,}/);
  const out: ReactNode[] = [];
  blocks.forEach((block, i) => {
    const lines = block.split("\n");
    if (block.startsWith("## ")) {
      out.push(<h2 key={i} className="mt-8 font-serif text-2xl font-normal tracking-title">{block.slice(3).split("\n")[0]}</h2>);
      const rest = lines.slice(1).join(" ").trim();
      if (rest) out.push(<p key={`${i}p`} className="mt-3">{rest}</p>);
    } else if (lines.every((l) => l.startsWith("- "))) {
      out.push(
        <ul key={i} className="mt-3 list-disc pl-6">
          {lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}
        </ul>,
      );
    } else {
      out.push(<p key={i} className="mt-3">{lines.join(" ")}</p>);
    }
  });
  return <div className="max-w-prose text-base">{out}</div>;
}
