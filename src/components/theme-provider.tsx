"use client";

import { createContext, useContext, ReactNode } from "react";

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
  return (
    <ThemeContext.Provider value={{ theme: "light", setTheme: () => {}, isNight: false, mounted: true }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useOutsideThemeContext() {
  return useContext(ThemeContext);
}
