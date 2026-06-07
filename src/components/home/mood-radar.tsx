"use client";

import Link from "next/link";
import { Coffee, Sparkles, Dumbbell, Music, PartyPopper, BookOpen, Briefcase, Plane } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";

const MOODS = [
  { label: "Manger", icon: Coffee, mood: "FOOD", color: "from-orange-500 to-orange-600" },
  { label: "Chill", icon: Sparkles, mood: "CHILL", color: "from-purple-500 to-purple-600" },
  { label: "Sport", icon: Dumbbell, mood: "SPORT", color: "from-red-500 to-red-600" },
  { label: "Musique", icon: Music, mood: "MUSIC", color: "from-pink-500 to-pink-600" },
  { label: "Sortir", icon: PartyPopper, mood: "PARTY", color: "from-yellow-500 to-yellow-600" },
  { label: "Étudier", icon: BookOpen, mood: "STUDY", color: "from-blue-500 to-blue-600" },
  { label: "Business", icon: Briefcase, mood: "BUSINESS", color: "from-slate-500 to-slate-600" },
  { label: "Voyage", icon: Plane, mood: "TRAVEL", color: "from-emerald-500 to-emerald-600" },
];

export function MoodRadar() {
  return (
    <section className="animate-slide-up">
      <SectionTitle title="Ton mood ce soir ?" />
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {MOODS.map((mood) => {
          const Icon = mood.icon;
          return (
            <Link
              key={mood.mood}
              href={`/plans?mood=${mood.mood}`}
              className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[var(--os-card)] transition-colors"
            >
              <div className={`bg-gradient-to-br ${mood.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-[var(--os-fg)] text-center truncate">
                {mood.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
