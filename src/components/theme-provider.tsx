"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

interface ThemeContextValue {
  theme: string;
  setTheme: (t: string) => void;
  isNight: boolean;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  isNight: false,
  mounted: false,
});

function ThemeContextBridge({ children }: { children: ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isNight = resolvedTheme === "dark";

  return (
    <ThemeContext.Provider
      value={{ theme: theme ?? "dark", setTheme, isNight, mounted }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function OutsideThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <ThemeContextBridge>{children}</ThemeContextBridge>
    </NextThemesProvider>
  );
}

export function useOutsideThemeContext() {
  return useContext(ThemeContext);
}
