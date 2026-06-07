"use client";

import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { OutsideEmptyState } from "@/components/ui/outside-empty-state";

interface Moment {
  id: string;
  mediaUrl: string;
  type: string;
  caption: string | null;
  author: { name: string | null; image: string | null };
  badge?: string | null;
}

interface MomentsSectionProps {
  moments?: Moment[];
  loading?: boolean;
}

export function MomentsSection({ moments = [], loading }: MomentsSectionProps) {
  if (loading) {
    return (
      <section className="animate-slide-up">
        <SectionTitle title="Moments qui montent" />
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 w-24 h-32 rounded-lg bg-[var(--os-card)] animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (moments.length === 0) {
    return (
      <section className="animate-slide-up">
        <OutsideEmptyState
          icon={Sparkles}
          title="Aucun moment pour le moment"
          description="Partage le tien ou découvre les comptes actifs."
          actions={
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                href="/moments/new"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                Publier
              </Link>
              <Link
                href="/trending"
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-outside-300 px-5 py-2.5 text-sm font-bold text-outside-600 hover:bg-outside-50/50 transition-all"
              >
                Découvrir
              </Link>
            </div>
          }
        />
      </section>
    );
  }

  return (
    <section className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle title="Moments qui montent" />
        <Link
          href="/moments"
          className="text-xs font-semibold text-outside-500 hover:text-outside-600"
        >
          Voir tout →
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2">
        {moments.slice(0, 5).map((moment) => (
          <Link
            key={moment.id}
            href={`/moments/${moment.id}`}
            className="group shrink-0 w-24 h-32 rounded-lg overflow-hidden relative"
          >
            <img
              src={moment.mediaUrl}
              alt={moment.caption || "Moment"}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
            {moment.badge && (
              <div className="absolute top-2 right-2 bg-outside-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {moment.badge}
              </div>
            )}
            <div className="absolute bottom-2 left-2 right-2">
              {moment.author?.image && (
                <img
                  src={moment.author.image}
                  alt={moment.author.name || "Author"}
                  className="h-6 w-6 rounded-full border-2 border-white object-cover"
                />
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
