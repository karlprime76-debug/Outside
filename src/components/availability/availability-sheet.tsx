"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Clock, Coffee, Sparkles, Dumbbell, Music, PartyPopper, BookOpen, Briefcase, Plane } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";

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
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function AvailabilitySheet({ open, onClose, onSubmitted }: Props) {
  const { addToast } = useToast();
  const haptic = useHaptic();
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
        haptic.success();
        addToast("Tu es maintenant disponible !", "success");
        onSubmitted?.();
        onClose();
      } else {
        haptic.error();
        const data = await res.json().catch(() => ({}));
        addToast(data.error || "Erreur", "error");
      }
    } catch {
      haptic.error();
      addToast("Erreur réseau", "error");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = selectedMood && selectedDuration;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Je suis dispo"
      footer={(
        <button
          onClick={submit}
          disabled={!canSubmit || loading}
          className="w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? "Activation..." : "Je suis dispo"}
        </button>
      )}
    >
      <div className="space-y-5">
        <p className="text-sm text-[var(--os-muted)]">Quel est ton mood ?</p>
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map((m) => {
            const Icon = m.icon;
            const isSelected = selectedMood === m.value;
            return (
              <button
                key={m.value}
                onClick={() => { haptic.light(); setSelectedMood(m.value); }}
                className={`flex flex-col items-center gap-1 rounded-xl p-2.5 transition-all active:scale-95 ${
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

        <p className="text-sm text-[var(--os-muted)]">Pour combien de temps ?</p>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => {
            const isSelected = selectedDuration === d.value;
            return (
              <button
                key={d.value}
                onClick={() => { haptic.light(); setSelectedDuration(d.value); }}
                className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
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
      </div>
    </BottomSheet>
  );
}
