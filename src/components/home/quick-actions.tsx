"use client";

import { useState } from "react";
import { Navigation, X } from "lucide-react";
import { ExpressPlanSheet } from "@/components/plans/express-plan-sheet";
import { BottomSheet } from "@/components/ui/bottom-sheet";

interface QuickActionsProps {
  outsideStatus?: { type: string; text: string | null; expiresAt: string } | null;
  onStatusUpdate?: (status: { type: string; text: string | null; expiresAt: string } | null) => void;
}

export function QuickActions({ outsideStatus, onStatusUpdate }: QuickActionsProps) {
  const [outsideStatusSheetOpen, setOutsideStatusSheetOpen] = useState(false);

  async function setStatus(type: string, durationHours: number = 2) {
    const res = await fetch("/api/outside-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, durationHours }),
    });
    if (res.ok) {
      const data = await res.json();
      onStatusUpdate?.(data.status);
      setOutsideStatusSheetOpen(false);
    }
  }

  async function clearStatus() {
    await fetch("/api/outside-status", { method: "DELETE" });
    onStatusUpdate?.(null);
  }

  return (
    <>
      <section className="animate-slide-up">
        <div className="grid gap-3 sm:grid-cols-2">
          <ExpressPlanSheet
            onSelectTemplate={(template) => {
              const params = new URLSearchParams({
                mood: template.mood,
                title: template.defaultTitle,
                description: template.defaultDescription,
                isExpress: "true",
              });
              window.location.href = `/plans/new?${params.toString()}`;
            }}
          />
          {outsideStatus ? (
            <div className="flex items-center justify-between rounded-2xl border-2 border-outside-300 bg-outside-50/50 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-outside-700">
                  {outsideStatus.type === "OUT_NOW"
                    ? "Je suis dehors maintenant"
                    : outsideStatus.type === "AVAILABLE"
                      ? "Disponible"
                      : outsideStatus.type === "LOOKING_FOR_FOOD"
                        ? "Cherche à manger"
                        : outsideStatus.type === "LOOKING_FOR_CHILL"
                          ? "Cherche à chill"
                          : outsideStatus.type === "LOOKING_FOR_SPORT"
                            ? "Cherche du sport"
                            : outsideStatus.type === "LOOKING_FOR_MUSIC"
                              ? "Cherche de la musique"
                              : "Disponible"}
                </p>
                {outsideStatus.text && (
                  <p className="text-xs text-outside-600">{outsideStatus.text}</p>
                )}
                <p className="text-xs text-outside-600">
                  Jusqu&apos;à{" "}
                  {new Date(outsideStatus.expiresAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                onClick={clearStatus}
                className="rounded-full bg-white p-2 text-outside-600 hover:bg-outside-100 transition-colors"
                title="Désactiver"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setOutsideStatusSheetOpen(true)}
              className="group flex items-center justify-center gap-3 rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] py-5 text-lg font-black text-[var(--os-fg)] hover:border-outside-300 hover:bg-outside-50/50 transition-all pressable"
            >
              <Navigation className="h-6 w-6 text-outside-500" />
              Je suis dehors maintenant
            </button>
          )}
        </div>
      </section>

      <BottomSheet
        open={outsideStatusSheetOpen}
        onClose={() => setOutsideStatusSheetOpen(false)}
        title="Statut dehors maintenant"
        maxHeight="60vh"
      >
        <div className="space-y-3">
          <button
            onClick={() => setStatus("OUT_NOW")}
            className="w-full p-4 rounded-lg border hover:bg-accent transition-colors text-left"
          >
            <div className="font-semibold">Je suis dehors maintenant</div>
            <div className="text-sm text-muted-foreground">Montre que tu es actif</div>
          </button>
          <button
            onClick={() => setStatus("AVAILABLE")}
            className="w-full p-4 rounded-lg border hover:bg-accent transition-colors text-left"
          >
            <div className="font-semibold">Disponible</div>
            <div className="text-sm text-muted-foreground">Ouvert aux propositions</div>
          </button>
          <button
            onClick={() => setStatus("LOOKING_FOR_FOOD")}
            className="w-full p-4 rounded-lg border hover:bg-accent transition-colors text-left"
          >
            <div className="font-semibold">Cherche à manger</div>
            <div className="text-sm text-muted-foreground">Pour un repas improvisé</div>
          </button>
          <button
            onClick={() => setStatus("LOOKING_FOR_CHILL")}
            className="w-full p-4 rounded-lg border hover:bg-accent transition-colors text-left"
          >
            <div className="font-semibold">Cherche à chill</div>
            <div className="text-sm text-muted-foreground">Détente et relaxation</div>
          </button>
          <button
            onClick={() => setStatus("LOOKING_FOR_SPORT")}
            className="w-full p-4 rounded-lg border hover:bg-accent transition-colors text-left"
          >
            <div className="font-semibold">Cherche du sport</div>
            <div className="text-sm text-muted-foreground">Pour bouger et transpirer</div>
          </button>
          <button
            onClick={() => setStatus("LOOKING_FOR_MUSIC")}
            className="w-full p-4 rounded-lg border hover:bg-accent transition-colors text-left"
          >
            <div className="font-semibold">Cherche de la musique</div>
            <div className="text-sm text-muted-foreground">Pour danser et profiter</div>
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
