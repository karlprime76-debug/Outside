"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface ThemeContextValue {
  theme: string;
  setTheme: (_t: string) => void;
  isNight: boolean;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  isNight: false,
  mounted: true,
});

export function OutsideThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("outside-theme") || "light";
    setThemeState(stored);
    document.documentElement.classList.toggle("dark", stored === "dark");
    setMounted(true);
  }, []);

  const setTheme = useCallback((t: string) => {
    setThemeState(t);
    localStorage.setItem("outside-theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  const isNight = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isNight, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useOutsideThemeContext() {
  return useContext(ThemeContext);
}
