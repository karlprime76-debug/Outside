"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

type Theme = "day" | "night";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  isNight: boolean;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "day",
  setTheme: () => {},
  isNight: false,
  mounted: false,
});

function getThemeByHour(): Theme {
  const hour = new Date().getHours();
  return hour >= 6 && hour <= 18 ? "day" : "night";
}

function applyTheme(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export function OutsideThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("day");
  const [mounted, setMounted] = useState(false);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("outside-theme-override", t);
    }
  }, []);

  useEffect(() => {
    // Lecture initiale
    const stored = typeof localStorage !== "undefined"
      ? (localStorage.getItem("outside-theme-override") as Theme | null)
      : null;

    const initial = stored || getThemeByHour();
    setThemeState(initial);
    applyTheme(initial);
    setMounted(true);

    // Mise à jour auto chaque minute
    const interval = setInterval(() => {
      const storedNow = typeof localStorage !== "undefined"
        ? (localStorage.getItem("outside-theme-override") as Theme | null)
        : null;
      if (!storedNow) {
        const auto = getThemeByHour();
        setThemeState((prev) => {
          if (prev !== auto) {
            applyTheme(auto);
            return auto;
          }
          return prev;
        });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, isNight: theme === "night", mounted }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useOutsideThemeContext() {
  return useContext(ThemeContext);
}
