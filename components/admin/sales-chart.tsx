"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

type Point = { date: string; revenue: number; orders: number };

const H = 180;
const PAD_L = 56;
const PAD_B = 24;

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p) * p;
}

const shortDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
const compact = (n: number) => new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(n);

/**
 * Ventes par jour : une seule série (pas de légende, le titre la nomme),
 * barres fines en accent, infobulle au survol et au clavier, tableau équivalent pour les lecteurs d'écran.
 */
export function SalesChart({ series, currency }: { series: Point[]; currency: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...series.map((s) => s.revenue), 0));
  const width = 720;
  const plotW = width - PAD_L;
  const step = plotW / Math.max(series.length, 1);
  const barW = Math.max(2, Math.min(24, step - 2));
  const ticks = [0, max / 2, max];
  const labelEvery = Math.ceil(series.length / 8);
  const h = hover != null ? series[hover] : null;

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${width} ${H + PAD_B}`} className="h-auto w-full" role="img" aria-label={`Chiffre d'affaires par jour sur ${series.length} jours`}>
        {ticks.map((t) => {
          const y = H - (t / max) * H;
          return (
            <g key={t}>
              <line x1={PAD_L} x2={width} y1={y} y2={y} stroke="var(--color-line)" strokeWidth={1} />
              <text x={PAD_L - 8} y={y + 4} textAnchor="end" fontSize={11} fill="var(--color-ink-muted)" className="tabular-nums">
                {compact(t)}
              </text>
            </g>
          );
        })}
        {series.map((s, i) => {
          const x = PAD_L + i * step + (step - barW) / 2;
          const bh = s.revenue > 0 ? Math.max(2, (s.revenue / max) * H) : 0;
          return (
            <g key={s.date}>
              {/* Zone de survol plus grande que la barre. */}
              <rect
                x={PAD_L + i * step}
                y={0}
                width={step}
                height={H}
                fill={hover === i ? "var(--color-surface-alt)" : "transparent"}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${shortDate(s.date)} : ${formatPrice(s.revenue, currency)}, ${s.orders} commande(s)`}
              />
              {bh > 0 && <path d={roundedTop(x, H - bh, barW, bh, Math.min(4, barW / 2))} fill="var(--color-accent)" pointerEvents="none" />}
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize={11} fill="var(--color-ink-muted)">
                  {shortDate(s.date)}
                </text>
              )}
            </g>
          );
        })}
        <line x1={PAD_L} x2={width} y1={H} y2={H} stroke="var(--color-ink-muted)" strokeWidth={1} />
      </svg>
      {h && hover != null && (
        <div
          role="tooltip"
          className="pointer-events-none absolute top-0 rounded-sm border border-line bg-surface px-3 py-2 text-xs shadow-overlay"
          style={{ left: `${((PAD_L + hover * step + step / 2) / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          <p className="font-semibold">{shortDate(h.date)}</p>
          <p className="tabular-nums">{formatPrice(h.revenue, currency)}</p>
          <p className="text-ink-muted tabular-nums">{h.orders} commande(s)</p>
        </div>
      )}
      <table className="sr-only">
        <caption>Chiffre d&apos;affaires par jour</caption>
        <thead>
          <tr><th scope="col">Date</th><th scope="col">Chiffre d&apos;affaires</th><th scope="col">Commandes</th></tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.date}><td>{shortDate(s.date)}</td><td>{formatPrice(s.revenue, currency)}</td><td>{s.orders}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Barre à extrémité arrondie (4 px), ancrée à plat sur la ligne de base. */
function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}
