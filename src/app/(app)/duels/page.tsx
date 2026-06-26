"use client";

import { Sword, Users, Trophy, Sparkles, Heart, Zap } from "lucide-react";
import { AnimatedPage } from "@/components/ui/animated-page";
import Link from "next/link";

const STEPS = [
  { icon: Users, title: "On te propose 2 profils", desc: "Deux personnes aléatoires s'affrontent. À toi de choisir ton préféré." },
  { icon: Heart, title: "Tu votes pour ton favori", desc: "Tape sur celui que tu préfères. Simple et rapide." },
  { icon: Zap, title: "Si c'est réciproque… Match !", desc: "Si la personne que tu as choisie te choisit aussi, c'est un match !" },
  { icon: Trophy, title: "Gagne des duels, monte en rang", desc: "Chaque victoire te fait grimper dans le classement. Deviens le plus populaire." },
];

export default function DuelsPage() {
  return (
    <AnimatedPage className="pb-24">
      <div className="sticky top-0 z-30 bg-[var(--os-bg)]/80 backdrop-blur-md border-b border-[var(--os-card-border)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="rounded-xl bg-gradient-to-br from-neon-rose to-neon-violet p-2.5 shadow-glow">
            <Sword className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-black text-[var(--os-fg)]">Duels</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-neon-rose/10 via-accent-500/5 to-neon-violet/10 border border-[var(--os-card-border)] p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-rose to-neon-violet flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Sword className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-black text-[var(--os-fg)] mb-2">Comment ça marche ?</h2>
          <p className="text-sm text-[var(--os-muted)] max-w-md mx-auto">
            Le principe est simple : on te montre deux profils, tu choisis celui que tu préfères.
            Si un jour vous vous plaisez mutuellement… c&rsquo;est un match !
          </p>
        </div>

        <div className="grid gap-4">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-4 items-start rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-neon-rose/20 to-neon-violet/20 flex items-center justify-center">
                <step.icon className="h-5 w-5 text-neon-rose" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-neon-rose">Étape {i + 1}</span>
                  <span className="text-sm font-bold text-[var(--os-fg)]">{step.title}</span>
                </div>
                <p className="text-xs text-[var(--os-muted)]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-neon-rose" />
            <h3 className="text-lg font-bold text-[var(--os-fg)]">Prochainement</h3>
          </div>
          <ul className="space-y-2 text-sm text-[var(--os-muted)]">
            <li className="flex items-start gap-2"><Zap className="h-4 w-4 text-neon-rose mt-0.5 flex-shrink-0" /> Mode rapide : enchaîne les duels sans limite</li>
            <li className="flex items-start gap-2"><Trophy className="h-4 w-4 text-neon-rose mt-0.5 flex-shrink-0" /> Classement hebdomadaire des vainqueurs</li>
            <li className="flex items-start gap-2"><Users className="h-4 w-4 text-neon-rose mt-0.5 flex-shrink-0" /> Défie tes amis : crée des duels privés</li>
          </ul>
        </div>

        <Link
          href="/discover"
          className="block w-full rounded-xl bg-gradient-to-r from-neon-rose to-neon-violet py-3.5 text-center text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
        >
          Découvrir des profils
        </Link>
      </div>
    </AnimatedPage>
  );
}
