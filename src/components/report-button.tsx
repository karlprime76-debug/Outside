"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Flag, Send } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";

const BASE_REASONS = [
  { value: "INAPPROPRIATE_CONTENT", label: "Contenu inapproprié" },
  { value: "HARASSMENT", label: "Harcèlement" },
  { value: "SPAM", label: "Spam" },
  { value: "FAKE_PROFILE", label: "Faux profil" },
  { value: "DANGEROUS_PLAN", label: "Plan dangereux" },
  { value: "UNDERAGE", label: "Mineur" },
  { value: "SCAM", label: "Arnaque" },
  { value: "VIOLENCE", label: "Violence" },
  { value: "HATE", label: "Discours haineux" },
  { value: "SEXUAL_CONTENT", label: "Contenu sexuel" },
  { value: "PRIVATE_INFO", label: "Infos privées" },
  { value: "COPYRIGHT", label: "Droits d'auteur" },
  { value: "OTHER", label: "Autre" },
];

const AUDIO_REASONS = [
  { value: "COPYRIGHT", label: "Droits d'auteur" },
  { value: "INAPPROPRIATE_CONTENT", label: "Contenu inapproprié" },
  { value: "SPAM", label: "Spam" },
  { value: "OTHER", label: "Autre" },
];

interface ReportButtonProps {
  targetType: string;
  targetId: string;
}

export function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const { addToast } = useToast();
  const haptic = useHaptic();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const reasons = targetType === "AUDIO_TRACK" ? AUDIO_REASONS : BASE_REASONS;

  async function submit() {
    if (!reason) {
      haptic.error();
      addToast("Choisis une raison", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok || res.status === 200) {
        haptic.success();
        addToast(data.message || "Signalement envoyé", "success");
        setOpen(false);
        setReason("");
        setDescription("");
      } else {
        haptic.error();
        addToast(data.error || "Erreur lors du signalement", "error");
      }
    } catch {
      haptic.error();
      addToast("Erreur réseau", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { haptic.light(); setOpen(true); }}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors dark:text-zinc-400 dark:hover:bg-red-950/20 dark:hover:text-red-400 active:scale-95"
      >
        <Flag className="h-3.5 w-3.5" />
        Signaler
      </button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Signaler"
        footer={(
          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Send className="h-4 w-4" />
            {loading ? "Envoi..." : "Envoyer le signalement"}
          </button>
        )}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {reasons.map((r: { value: string; label: string }) => (
              <button
                key={r.value}
                onClick={() => { haptic.light(); setReason(r.value); }}
                className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors active:scale-95 ${
                  reason === r.value
                    ? "border-outside-500 bg-outside-50 text-outside-700 dark:border-outside-700 dark:bg-outside-950/20 dark:text-outside-400"
                    : "border-[var(--os-card-border)] bg-[var(--os-card)] text-[var(--os-fg)] hover:border-outside-200"
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
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] px-3 py-2 text-sm text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500 placeholder:text-[var(--os-muted)] resize-none"
          />
        </div>
      </BottomSheet>
    </>
  );
}
