"use client";

import { useEffect } from "react";

/**
 * ThemeMeta — Met à jour dynamiquement :
 * - theme-color selon le thème OUTSIDE (day/night)
 * - favicon selon le thème OUTSIDE (light/dark)
 */

const THEME_COLOR_DAY = "#fafafa";
const THEME_COLOR_NIGHT = "#0a0a0f";

export function ThemeMeta() {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;

    function updateTheme() {
      const isNight = document.documentElement.getAttribute("data-theme") === "night";

      if (meta) {
        meta.setAttribute("content", isNight ? THEME_COLOR_NIGHT : THEME_COLOR_DAY);
      }

      if (faviconLink) {
        faviconLink.href = isNight ? "/favicon-dark.png" : "/favicon-32x32.png";
      }
    }

    updateTheme();

    // Observer data-theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.attributeName === "data-theme") updateTheme();
      });
    });
    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
