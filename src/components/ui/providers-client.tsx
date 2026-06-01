"use client";

import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";

export function UiProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmProvider>
      <ToastProvider>{children}</ToastProvider>
    </ConfirmProvider>
  );
}
