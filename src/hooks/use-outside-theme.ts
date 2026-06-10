"use client";

import { useEffect, useState, useCallback } from "react";

export type OutsideTheme = "day" | "night";

export interface OutsideThemeClasses {
  /** Background principal */
  bg: string;
  /** Texte principal */
  text: string;
  /** Background carte */
  card: string;
  /** Bordure carte/séparateur */
  border: string;
  /** Texte muted/secondaire */
  muted: string;
  /** Texte primary (orange) */
  primary: string;
  /** Texte accent (amber) */
  accent: string;
  /** Background header/glass */
  header: string;
  /** Glow shadow */
  glow: string;
}

function getThemeByHour(): OutsideTheme {
  const hour = new Date().getHours();
  return hour >= 6 && hour <= 18 ? "day" : "night";
}

const dayClasses: OutsideThemeClasses = {
  bg: "bg-[#fafafa]",
  text: "text-zinc-900",
  card: "bg-white border-zinc-200",
  border: "border-zinc-200",
  muted: "text-zinc-500",
  primary: "text-outside-600",
  accent: "text-accent-600",
  header: "bg-white/80 border-zinc-200/50",
  glow: "shadow-glow",
};

const nightClasses: OutsideThemeClasses = {
  bg: "bg-[#0a0a0f]",
  text: "text-zinc-100",
  card: "bg-[#12121a] border-[#1e1e2d]",
  border: "border-[#1e1e2d]",
  muted: "text-[#8a8a9a]",
  primary: "text-outside-400",
  accent: "text-accent-400",
  header: "bg-[#0a0a0f]/80 border-[#1e1e2d]/50",
  glow: "shadow-glow-accent",
};

export function useOutsideTheme() {
  const [currentTheme, setCurrentTheme] = useState<OutsideTheme | null>(null);

  const update = useCallback(() => {
    setCurrentTheme(getThemeByHour());
  }, []);

  useEffect(() => {
    update();
    // Vérifie chaque minute pour changer automatiquement à 6h et 19h
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [update]);

  const isNight = currentTheme === "night";
  const isDay = currentTheme === "day";

  const logoIcon = "/brand/outside-logo.png";

  const classes = isNight ? nightClasses : dayClasses;

  return {
    currentTheme,
    isNight,
    isDay,
    logoIcon,
    classes,
    mounted: currentTheme !== null,
  };
}
