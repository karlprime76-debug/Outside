"use client";

import Link from "next/link";
import { Users, Plus, Sparkles, Radio } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";

interface StarterPackProps {
  show?: boolean;
  activeCity?: string | null;
}

const STARTER_ITEMS = [
  {
    icon: Users,
    title: "Comptes à suivre",
    description: "Trouve les personnes actives de ta ville",
    href: "/friends",
    cta: "Découvrir",
  },
  {
    icon: Plus,
    title: "Ton premier plan",
    description: "Crée un plan et trouve des personnes",
    href: "/plans/new",
    cta: "Créer",
  },
  {
    icon: Sparkles,
    title: "Ton premier moment",
    description: "Partage l'ambiance d'un lieu",
    href: "/moments/new",
    cta: "Publier",
  },
  {
    icon: Radio,
    title: "Lance un live",
    description: "Montre ce que tu fais maintenant",
    href: "/live/new",
    cta: "Démarrer",
  },
];

export function StarterPack({ show = false, activeCity }: StarterPackProps) {
  if (!show) return null;

  return (
    <section className="animate-slide-up">
      <SectionTitle title={`Starter Pack${activeCity ? ` — ${activeCity}` : ""}`} />
      <div className="grid gap-3 sm:grid-cols-2">
        {STARTER_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-3 p-4 rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-300 hover:bg-outside-50/50 dark:hover:bg-outside-950/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-outside-500 group-hover:text-outside-600">
                  {item.cta} →
                </span>
              </div>
              <div>
                <p className="font-semibold text-[var(--os-fg)]">{item.title}</p>
                <p className="text-xs text-[var(--os-muted)] mt-1">{item.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
