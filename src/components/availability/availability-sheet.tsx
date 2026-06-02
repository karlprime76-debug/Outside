"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { X, Clock, Coffee, Sparkles, Dumbbell, Music, PartyPopper, BookOpen, Briefcase, Plane } from "lucide-react";

const MOODS = [
  { label: "Manger", icon: Coffee, value: "FOOD" },
  { label: "Chill", icon: Sparkles, value: "CHILL" },
  { label: "Sport", icon: Dumbbell, value: "SPORT" },
  { label: "Musique", icon: Music, value: "MUSIC" },
  { label: "Sortir", icon: PartyPopper, value: "OUT" },
  { label: "Étudier", icon: BookOpen, value: "STUDY" },
  { label: "Business", icon: Briefcase, value: "BUSINESS" },
  { label: "Voyage", icon: Plane, value: "TRAVEL" },
];

const DURATIONS = [
  { label: "30 min", value: "30min" },
  { label: "1h", value: "1h" },
  { label: "2h", value: "2h" },
  { label: "Ce soir", value: "tonight" },
];

interface Props {
  onClose: () => void;
  onSubmitted?: () => void;
}

export function AvailabilitySheet({ onClose, onSubmitted }: Props) {
  const { addToast } = useToast();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!selectedMood || !selectedDuration) return;
    setLoading(true);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: selectedMood, duration: selectedDuration }),
      });
      if (res.ok) {
        addToast("Tu es maintenant disponible !", "success");
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

  const canSubmit = selectedMood && selectedDuration;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center px-0 sm:px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-card dark:border dark:border-surface-border max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-[var(--os-fg)]">Je suis dispo</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-4 w-4 text-[var(--os-muted)]" />
          </button>
        </div>

        <p className="text-sm text-[var(--os-muted)] mb-3">Quel est ton mood ?</p>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {MOODS.map((m) => {
            const Icon = m.icon;
            const isSelected = selectedMood === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setSelectedMood(m.value)}
                className={`flex flex-col items-center gap-1 rounded-xl p-2.5 transition-all ${
                  isSelected
                    ? "bg-outside-100 text-outside-700 ring-2 ring-outside-400"
                    : "bg-[var(--os-bg)] text-[var(--os-muted)] hover:bg-outside-50"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-bold">{m.label}</span>
              </button>
            );
          })}
        </div>

        <p className="text-sm text-[var(--os-muted)] mb-3">Pour combien de temps ?</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {DURATIONS.map((d) => {
            const isSelected = selectedDuration === d.value;
            return (
              <button
                key={d.value}
                onClick={() => setSelectedDuration(d.value)}
                className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-outside-100 text-outside-700 ring-2 ring-outside-400"
                    : "bg-[var(--os-bg)] text-[var(--os-muted)] hover:bg-outside-50"
                }`}
              >
                <Clock className="h-3 w-3" />
                {d.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={submit}
          disabled={!canSubmit || loading}
          className="w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50"
        >
          {loading ? "Activation..." : "Me rendre disponible"}
        </button>
      </div>
    </div>
  );
}
