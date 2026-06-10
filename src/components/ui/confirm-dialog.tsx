"use client";

import { useState, useCallback, useEffect, createContext, useContext } from "react";
import { cn } from "@/lib/cn";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ConfirmContextType {
  confirm: (_options: Omit<ConfirmDialogState, "open">) => void;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirmer",
    cancelLabel: "Annuler",
    variant: "default",
  });

  const confirm = useCallback((options: Omit<ConfirmDialogState, "open">) => {
    setState({ ...options, open: true });
  }, []);

  const close = useCallback(() => {
    setState((prev) => {
      prev.onCancel?.();
      return { ...prev, open: false };
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.onConfirm?.();
    setState((s) => ({ ...s, open: false }));
  }, [state]);

  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [state.open, close]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200 dark:bg-surface-card dark:border dark:border-surface-border">
            <div className="flex items-start gap-3">
              {state.variant === "danger" && (
                <div className="rounded-full bg-red-100 p-2 dark:bg-red-950/30">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{state.title}</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{state.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={close}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {state.cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors",
                  state.variant === "danger"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gradient-to-r from-outside-500 to-accent-500 shadow-glow hover:shadow-glow-lg"
                )}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
