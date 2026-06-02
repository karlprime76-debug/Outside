"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { X, CheckCircle, UserCheck, MapPin, MessageSquare } from "lucide-react";

interface Props {
  reviewedId: string;
  planId?: string | null;
  reviewedName?: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function TrustReviewModal({ reviewedId, planId, reviewedName, onClose, onSubmitted }: Props) {
  const { addToast } = useToast();
  const [wasPresent, setWasPresent] = useState<boolean | null>(null);
  const [respectful, setRespectful] = useState<boolean | null>(null);
  const [realProfile, setRealProfile] = useState<boolean | null>(null);
  const [realPlan, setRealPlan] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

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
          realProfile,
          realPlan,
          comment: comment.trim() || null,
        }),
      });

      if (res.ok) {
        addToast("Merci, ton retour aide à rendre OUTSIDE plus sûr.", "success");
        onSubmitted?.();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || "Erreur", "error");
      }
    } catch {
      addToast("Erreur réseau", "error");
    } finally {
      setLoading(false);
    }
  }

  function Toggle({ value, onChange, yesLabel, noLabel }: { value: boolean | null; onChange: (v: boolean) => void; yesLabel: string; noLabel: string }) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => onChange(true)}
          className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
            value === true
              ? "border-green-300 bg-green-50 text-green-700"
              : "border-[var(--os-card-border)] bg-[var(--os-bg)] text-[var(--os-muted)] hover:border-green-200"
          }`}
        >
          {yesLabel}
        </button>
        <button
          onClick={() => onChange(false)}
          className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
            value === false
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-[var(--os-card-border)] bg-[var(--os-bg)] text-[var(--os-muted)] hover:border-red-200"
          }`}
        >
          {noLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center px-0 sm:px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-card dark:border dark:border-surface-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-[var(--os-fg)]">
            Valider {reviewedName || "la confiance"}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-4 w-4 text-[var(--os-muted)]" />
          </button>
        </div>

        <p className="text-sm text-[var(--os-muted)] mb-4">
          Ton retour reste anonyme et aide la communauté.
        </p>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-[var(--os-fg)] mb-2">
              <UserCheck className="h-4 w-4 text-outside-500" />
              Cette personne était-elle présente ?
            </label>
            <Toggle value={wasPresent} onChange={setWasPresent} yesLabel="Oui, présent.e" noLabel="Non, absent.e" />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-[var(--os-fg)] mb-2">
              <CheckCircle className="h-4 w-4 text-outside-500" />
              Était-elle respectueuse ?
            </label>
            <Toggle value={respectful} onChange={setRespectful} yesLabel="Oui" noLabel="Non" />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-[var(--os-fg)] mb-2">
              <MapPin className="h-4 w-4 text-outside-500" />
              Ce profil semble-t-il réel ?
            </label>
            <Toggle value={realProfile} onChange={setRealProfile} yesLabel="Oui" noLabel="Non" />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-[var(--os-fg)] mb-2">
              <MessageSquare className="h-4 w-4 text-outside-500" />
              Le plan était-il réel ?
            </label>
            <Toggle value={realPlan} onChange={setRealPlan} yesLabel="Oui" noLabel="Non" />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--os-muted)] mb-1">Commentaire (optionnel)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              maxLength={200}
              className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-3 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500 resize-none"
              placeholder="Décris brièvement ton expérience..."
            />
            <p className="text-[10px] text-[var(--os-muted)] text-right">{comment.length}/200</p>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          {loading ? "Envoi..." : "Envoyer mon retour"}
        </button>
      </div>
    </div>
  );
}
