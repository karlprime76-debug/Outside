"use client";

import { useState, useCallback, createContext, useContext } from "react";
import { cn } from "@/lib/cn";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useStandaloneMode } from "@/hooks/use-standalone-mode";

interface Toast {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
}

interface ToastContextType {
  addToast: (_message: string, _type?: Toast["type"]) => void;
  removeToast: (_id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const mode = useStandaloneMode();
  const isStandalone = mode !== "browser";

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className={cn(
        "fixed left-0 right-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none transition-all",
        isStandalone ? "bottom-24" : "bottom-20",
        "md:bottom-4"
      )}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition-all animate-in slide-in-from-bottom-4 fade-in duration-300",
              toast.type === "success" && "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800",
              toast.type === "error" && "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
              toast.type === "info" && "bg-white text-zinc-800 border border-zinc-200 dark:bg-surface-card dark:text-zinc-200 dark:border-surface-border"
            )}
          >
            {toast.type === "success" && <CheckCircle className="h-4 w-4" />}
            {toast.type === "error" && <AlertCircle className="h-4 w-4" />}
            {toast.type === "info" && <Info className="h-4 w-4 text-outside-500" />}
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Fermer"
              className="ml-1 rounded-full p-0.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-95"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
