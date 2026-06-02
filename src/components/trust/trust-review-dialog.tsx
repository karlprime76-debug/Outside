"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { ThumbsUp, ThumbsDown, X, Star } from "lucide-react";

interface Props {
  planId: string;
  reviewedId: string;
  reviewedName: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function TrustReviewDialog({ planId, reviewedId, reviewedName, onClose, onSubmitted }: Props) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [wasPresent, setWasPresent] = useState<boolean | null>(null);
  const [respectful, setRespectful] = useState<boolean | null>(null);
  const [realPlan, setRealPlan] = useState<boolean | null>(null);
  const [goodVibe, setGoodVibe] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/trust/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewedId,
          planId,
          wasPresent,
          respectful,
          realPlan,
          goodVibe,
          comment: comment.trim() || undefined,
        }),
      });

      if (res.ok) {
        addToast("Retour envoyé ! Merci.", "success");
        onSubmitted?.();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || "Erreur lors de l'envoi", "error");
      }
    } catch {
      addToast("Erreur réseau", "error");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = wasPresent !== null && respectful !== null && realPlan !== null && goodVibe !== null;

  function Toggle({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--os-fg)]">{label}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              value === true
                ? "bg-emerald-100 text-emerald-700"
                : "bg-[var(--os-bg)] text-[var(--os-muted)] hover:bg-emerald-50"
            }`}
          >
            <ThumbsUp className="h-3.5 w-3.5 inline mr-1" />
            Oui
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              value === false
                ? "bg-red-100 text-red-700"
                : "bg-[var(--os-bg)] text-[var(--os-muted)] hover:bg-red-50"
            }`}
          >
            <ThumbsDown className="h-3.5 w-3.5 inline mr-1" />
            Non
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-card dark:border dark:border-surface-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-[var(--os-fg)] flex items-center gap-2">
            <Star className="h-5 w-5 text-outside-500" />
            Donner un retour
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-4 w-4 text-[var(--os-muted)]" />
          </button>
        </div>

        <p className="text-sm text-[var(--os-muted)] mb-4">
          Ton retour sur <span className="font-semibold text-[var(--os-fg)]">{reviewedName}</span> reste anonyme.
        </p>

        <div className="space-y-4">
          <Toggle label="Cette personne était présente ?" value={wasPresent} onChange={setWasPresent} />
          <Toggle label="Respectueuse ?" value={respectful} onChange={setRespectful} />
          <Toggle label="Le plan était réel ?" value={realPlan} onChange={setRealPlan} />
          <Toggle label="Bonne ambiance ?" value={goodVibe} onChange={setGoodVibe} />

          <div>
            <label className="block text-xs font-bold text-[var(--os-muted)] mb-1">Commentaire (optionnel)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-3 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
              placeholder="Décris brièvement ton expérience..."
            />
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!canSubmit || loading}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
        >
          {loading ? "Envoi..." : "Envoyer le retour"}
        </button>
      </div>
    </div>
  );
}
