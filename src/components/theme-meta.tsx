"use client";

import { useEffect } from "react";

/**
 * ThemeMeta — Met à jour dynamiquement :
 * - theme-color selon le thème système (jour/nuit)
 * - favicon selon le thème système (light/dark)
 *
 * Ce composant NE change PAS l'icône installée PWA.
 * L'icône PWA reste stable (définie dans le manifest).
 * Seul le favicon du navigateur web change selon le thème.
 */

const THEME_COLOR_LIGHT = "#ffffff";
const THEME_COLOR_DARK = "#18181b";

export function ThemeMeta() {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const lightLink = document.querySelector('link[data-favicon="light"]');
    const darkLink = document.querySelector('link[data-favicon="dark"]');

    function updateTheme() {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

      if (meta) {
        meta.setAttribute(
          "content",
          isDark ? THEME_COLOR_DARK : THEME_COLOR_LIGHT
        );
      }

      // Active/désactive les link favicon selon le thème
      if (lightLink) {
        (lightLink as HTMLLinkElement).disabled = isDark;
      }
      if (darkLink) {
        (darkLink as HTMLLinkElement).disabled = !isDark;
      }
    }

    updateTheme();

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", updateTheme);

    return () => {
      mql.removeEventListener("change", updateTheme);
    };
  }, []);

  return null;
}
