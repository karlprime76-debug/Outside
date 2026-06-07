"use client";

import Link from "next/link";
import { Radio, Plus } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { OutsideEmptyState } from "@/components/ui/outside-empty-state";

interface Live {
  id: string;
  title: string;
  status: string;
  city?: string;
  viewerCount: number;
  host: { name: string | null };
}

interface LiveSectionProps {
  lives?: Live[];
  loading?: boolean;
}

export function LiveSection({ lives = [], loading }: LiveSectionProps) {
  if (loading || !lives || lives.length === 0) {
    return (
      <section className="animate-slide-up">
        <SectionTitle title="En direct maintenant" />
        <OutsideEmptyState
          icon={Radio}
          title="Aucun live en cours"
          description="Reviens dans quelques minutes ou lance le tien."
          actions={
            <Link
              href="/live/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              Lancer un live
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section className="animate-slide-up">
      <SectionTitle title="En direct maintenant" />
      <div className="space-y-3">
        {lives.slice(0, 3).map((live) => (
          <Link
            key={live.id}
            href={`/live/${live.id}`}
            className="flex items-center gap-3 p-4 rounded-2xl border-2 border-[var(--os-card-border)] hover:border-red-300 bg-[var(--os-card)] hover:bg-red-50/50 transition-colors"
          >
            <div className="shrink-0">
              <div className="flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5">
                <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-bold text-white">LIVE</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--os-fg)] truncate">{live.host?.name}</p>
              <p className="text-xs text-[var(--os-muted)]">{live.viewerCount} spectateurs</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-red-600">Regarder →</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
