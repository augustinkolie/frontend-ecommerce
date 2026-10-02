import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/** Losange : motif récurrent des tissus guinéens (leppi du Fouta-Djallon). */
function Diamond({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden focusable="false" className={className} style={style}>
      <path d="M5 0L10 5L5 10L0 5Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Mot-symbole : le nom en Fraunces 500, le point du dernier « i » remplacé par un losange.
 * Si le nom de la boutique (réglable dans l'admin) n'a pas de « i », il s'affiche simplement.
 * Précédé de l'emblème (cachet aux losanges). La taille suit la taille de police (text-*).
 */
export function Logo({ name, className, withMark = true }: { name: string; className?: string; withMark?: boolean }) {
  const i = name.lastIndexOf("i");
  return (
    <span className={cn("inline-flex items-center gap-3 font-serif text-3xl leading-none font-medium tracking-title", className)}>
      {withMark && <LogoMark style={{ width: "1.15em", height: "1.15em" }} />}
      <span className="sr-only">{name}</span>
      <span aria-hidden>
        {i === -1 ? (
          name
        ) : (
          <>
            {name.slice(0, i)}
            <span className="relative inline-block">
              ı
              {/* Position en em : suit la taille du texte. */}
              <Diamond className="absolute left-1/2 -translate-x-1/2" style={{ top: "0.15em", width: "0.19em", height: "0.19em" }} />
            </span>
            {name.slice(i + 1)}
          </>
        )}
      </span>
    </span>
  );
}

/**
 * Emblème (formats réduits : admin, icône d'onglet) : cachet rond, cinq losanges en croix,
 * les losanges latéraux en demi-teinte comme les fils d'une trame. Couleur courante.
 */
export function LogoMark({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden focusable="false" className={cn("shrink-0", className)} style={style}>
      <circle cx="24" cy="24" r="22.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <g fill="currentColor">
        <path d="M24 8.5L28.5 13L24 17.5L19.5 13Z" />
        <path d="M24 19.5L28.5 24L24 28.5L19.5 24Z" />
        <path d="M24 30.5L28.5 35L24 39.5L19.5 35Z" />
        <path d="M13 19.5L17.5 24L13 28.5L8.5 24Z" opacity="0.4" />
        <path d="M35 19.5L39.5 24L35 28.5L30.5 24Z" opacity="0.4" />
      </g>
    </svg>
  );
}
