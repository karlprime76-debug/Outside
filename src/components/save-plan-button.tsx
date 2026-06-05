"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";
import { useToast } from "@/components/ui/toast";

interface SavePlanButtonProps {
  planId: string;
  className?: string;
  variant?: "icon" | "button";
}

export function SavePlanButton({ planId, className = "", variant = "icon" }: SavePlanButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const haptic = useHaptic();
  const { addToast } = useToast();

  useEffect(() => {
    // Check saved state from a simple in-memory cache or local hint
    const checkSaved = async () => {
      try {
        const res = await fetch("/api/plans/saved");
        if (res.ok) {
          const data = await res.json();
          const isSaved = data.plans?.some((p: { id: string }) => p.id === planId);
          setSaved(isSaved);
        }
      } catch {
        // silently fail
      }
    };
    checkSaved();
  }, [planId]);

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      if (saved) {
        const res = await fetch(`/api/plans/${planId}/save`, { method: "DELETE" });
        if (res.ok) {
          setSaved(false);
          haptic.light();
          addToast("Plan retiré des sauvegardes", "info");
        }
      } else {
        const res = await fetch(`/api/plans/${planId}/save`, { method: "POST" });
        if (res.ok) {
          setSaved(true);
          haptic.success();
          addToast("Plan sauvegardé", "success");
        }
      }
    } catch {
      addToast("Erreur réseau", "error");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "button") {
    return (
      <button
        onClick={toggleSave}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-bold transition-all active:scale-95 ${
          saved
            ? "border-outside-500 bg-outside-50 text-outside-700 dark:bg-outside-950/20 dark:text-outside-400"
            : "border-[var(--os-card-border)] bg-[var(--os-card)] text-[var(--os-fg)] hover:border-outside-300"
        } ${className}`}
      >
        <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
        {saved ? "Sauvegardé" : "Sauvegarder"}
      </button>
    );
  }

  return (
    <button
      onClick={toggleSave}
      disabled={loading}
      className={`rounded-full p-2 transition-colors active:scale-95 ${
        saved
          ? "bg-outside-100 text-outside-600 dark:bg-outside-950/20 dark:text-outside-400"
          : "bg-[var(--os-bg)] text-[var(--os-muted)] hover:bg-outside-50 hover:text-outside-600"
      } ${className}`}
      aria-label={saved ? "Retirer des sauvegardes" : "Sauvegarder"}
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
    </button>
  );
}
