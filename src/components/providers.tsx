"use client";

import { SessionProvider } from "next-auth/react";
import { OutsideThemeProvider } from "./theme-provider";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <OutsideThemeProvider>
        {children}
      </OutsideThemeProvider>
    </SessionProvider>
  );
}
