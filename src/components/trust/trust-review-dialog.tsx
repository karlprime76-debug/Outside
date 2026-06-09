"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";

interface Props {
  planId: string;
  reviewedId: string;
  reviewedName: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function TrustReviewDialog({ planId, reviewedId, reviewedName, onClose, onSubmitted }: Props) {
  const { addToast } = useToast();
  const haptic = useHaptic();
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
        haptic.success();
        addToast("Retour envoyé ! Merci.", "success");
        onSubmitted?.();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        haptic.error();
        addToast(data.error || "Erreur lors de l'envoi", "error");
      }
    } catch {
      haptic.error();
      addToast("Erreur réseau", "error");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = wasPresent !== null && respectful !== null && realPlan !== null && goodVibe !== null;

  function Toggle({ label, value, onChange }: { label: string; value: boolean | null; onChange: (_v: boolean) => void }) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--os-fg)]">{label}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { haptic.light(); onChange(true); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors active:scale-95 ${
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
            onClick={() => { haptic.light(); onChange(false); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors active:scale-95 ${
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
    <BottomSheet
      open
      onClose={onClose}
      title="Donner un retour"
      footer={(
        <button
          onClick={submit}
          disabled={!canSubmit || loading}
          className="w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Send className="h-4 w-4" />
          {loading ? "Envoi..." : "Envoyer le retour"}
        </button>
      )}
    >
      <div className="space-y-5">
        <p className="text-sm text-[var(--os-muted)]">
          Ton retour sur <span className="font-semibold text-[var(--os-fg)]">{reviewedName}</span> reste anonyme.
        </p>

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
            maxLength={200}
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-3 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500 resize-none"
            placeholder="Décris brièvement ton expérience..."
          />
          <p className="text-[10px] text-[var(--os-muted)] text-right">{comment.length}/200</p>
        </div>
      </div>
    </BottomSheet>
  );
}
