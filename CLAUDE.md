# Règles de design — à respecter sans exception

## Direction
Boutique de mode éditoriale, sobre. La photo produit porte la couleur,
l'interface reste neutre. Références d'esprit : COS, Arket, &Other Stories.

## Couleurs
- Utilise UNIQUEMENT les variables de styles/tokens.css
  (bg, surface, surface-alt, ink, ink-muted, line, accent, success,
  warning, danger, focus).
- Accent terracotta (#B4532A) : prix soldés, badges promo, lien actif. Rien d'autre.
- Bouton principal : fond ink (#1C1A17), texte blanc.

## INTERDIT
- Tout dégradé : linear-gradient, radial-gradient, conic-gradient,
  bg-gradient-*, from-*, via-*, to-*, bg-clip-text en dégradé.
- Glassmorphism, backdrop-blur, ombres colorées, glow, néon.
- Violet, indigo, bleu électrique, couleurs Tailwind par défaut.
- Valeurs arbitraires : bg-[#...], text-[13px], etc.
- rounded-lg, rounded-xl, rounded-2xl (max : rounded-sm = 2px, rounded = 4px).
- shadow-md et plus dans la boutique.
- Emoji comme icônes ; icônes dans des cercles colorés.
- Sections « hero SaaS » : titre centré + sous-titre + 2 boutons + blob.

## Typographie
- Titres boutique : Fraunces 400-500. Texte/UI : Instrument Sans.
- Admin : Instrument Sans uniquement. Chiffres : tabular-nums.
- Échelle : 12, 14, 16, 18, 22, 28, 36, 48, 64 px.

## Mise en page
- Grille 4 px. Espacements : 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Mobile d'abord (375 px). Grille produits : 2 col mobile, 4 col desktop.
- Images produit 4:5, fond surface-alt, placeholder couleur unie.
- Animations : 150-200 ms, opacité/translation seulement.

## Code
- Server Components par défaut ; "use client" seulement si interactif.
- Réutilise components/ui avant de créer un composant.
- Avant de terminer une tâche d'interface : lance `npm run check:design`.

@AGENTS.md
