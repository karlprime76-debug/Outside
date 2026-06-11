"use client";

import { useState, useEffect } from "react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Bell, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function PushPrompt() {
  const { permission, subscribe, loading } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    // Ne pas afficher si les notifications sont déjà activées ou non supportées
    if (permission !== "default") return;

    // Ne pas afficher tout de suite, attendre 2 secondes
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem("outside_push_prompt_dismissed");
      if (!dismissed) {
        setVisible(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [permission]);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("outside_push_prompt_dismissed", "true");
  };

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (ok) {
      setVisible(false);
      addToast("Notifications activées !", "success");
      // Mettre à jour les paramètres via l'API si nécessaire
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pushEnabled: true }),
      });
    } else {
      addToast("Impossible d'activer les notifications.", "error");
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] md:bottom-8 md:left-auto md:right-8 md:max-w-sm animate-slide-up">
      <div className="relative overflow-hidden rounded-2xl bg-[var(--os-card)] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-[var(--os-card-border)]">
        {/* Decorative background */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-outside-500/10 blur-2xl" />
        
        <button 
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-[var(--os-muted)] hover:bg-[var(--os-bg)] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 text-white shadow-glow">
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1 pr-6">
            <h3 className="text-sm font-black text-[var(--os-fg)]">Active les notifications</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--os-muted)]">
              Ne manque plus aucune invitation, message ou plan sympa autour de toi.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="rounded-lg bg-outside-500 px-4 py-2 text-xs font-bold text-white shadow-glow transition-all hover:bg-outside-600 disabled:opacity-50"
              >
                {loading ? "Activation..." : "Activer"}
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)]"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
