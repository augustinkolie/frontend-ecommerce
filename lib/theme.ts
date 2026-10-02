/**
 * Thème clair / sombre, commun à la boutique et à l'admin.
 * Le choix est mémorisé dans le navigateur (localStorage « theme » : "light" | "dark").
 * Sans choix, le site suit le réglage du système.
 */
export const THEME_KEY = "theme";
export type Theme = "light" | "dark";

/**
 * Script exécuté dans <head> AVANT l'affichage : pose la classe .dark sur <html>,
 * pour qu'il n'y ait ni flash clair ni retour au thème clair à l'actualisation.
 * Reprend l'ancien réglage de l'admin (« admin:dark ») s'il existe.
 */
export const themeScript = `(function(){try{var s=localStorage,t=s.getItem("${THEME_KEY}");if(!t&&s.getItem("admin:dark")==="true"){t="dark";s.setItem("${THEME_KEY}",t)}var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;var h=document.documentElement;h.classList.toggle("dark",d);h.style.colorScheme=d?"dark":"light"}catch(e){}})();`;

export function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.classList.toggle("dark", theme === "dark");
  html.style.colorScheme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* stockage indisponible : le thème vaut pour la page en cours */
  }
}
