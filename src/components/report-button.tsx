"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Flag, X } from "lucide-react";

const REASONS = [
  { value: "INAPPROPRIATE_CONTENT", label: "Contenu inapproprié" },
  { value: "HARASSMENT", label: "Harcèlement" },
  { value: "SPAM", label: "Spam" },
  { value: "FAKE_PROFILE", label: "Faux profil" },
  { value: "DANGEROUS_PLAN", label: "Plan dangereux" },
  { value: "UNDERAGE", label: "Mineur" },
  { value: "OTHER", label: "Autre" },
];

interface ReportButtonProps {
  planId?: string;
  placeId?: string;
  reportedUserId?: string;
}

export function ReportButton({ planId, placeId, reportedUserId }: ReportButtonProps) {
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!reason) {
      addToast("Choisis une raison", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          description: description.trim() || undefined,
          planId,
          placeId,
          reportedUserId,
        }),
      });
      if (res.ok) {
        addToast("Signalement envoyé", "success");
        setOpen(false);
        setReason("");
        setDescription("");
      } else {
        addToast("Erreur lors du signalement", "error");
      }
    } catch {
      addToast("Erreur réseau", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors dark:text-zinc-400 dark:hover:bg-red-950/20 dark:hover:text-red-400"
      >
        <Flag className="h-3.5 w-3.5" />
        Signaler
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200 dark:bg-surface-card dark:border dark:border-surface-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Signaler</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                      reason === r.value
                        ? "border-outside-500 bg-outside-50 text-outside-700 dark:border-outside-700 dark:bg-outside-950/20 dark:text-outside-400"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-surface-card dark:text-zinc-300"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Détaille le problème (optionnel)..."
                rows={3}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-outside-500 dark:bg-surface-card dark:border-zinc-700 dark:text-zinc-100"
              />

              <button
                onClick={submit}
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
              >
                {loading ? "Envoi..." : "Envoyer le signalement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
