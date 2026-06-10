"use client";

import Link from "next/link";
import Image from "next/image";
import { Flame, Radio, Sparkles, Plus } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { OutsideEmptyState } from "@/components/ui/outside-empty-state";

interface NowHappeningProps {
  lives?: Array<{ id: string; host?: { name: string }; viewerCount: number }>;
  moments?: Array<{ id: string; mediaUrl: string }>;
  loadingLives?: boolean;
  loadingMoments?: boolean;
}

export function NowHappening({ lives = [], moments = [], loadingLives, loadingMoments }: NowHappeningProps) {
  const hasContent = lives.length > 0 || moments.length > 0;

  if (loadingLives || loadingMoments) {
    return (
      <section className="animate-slide-up">
        <SectionTitle title="Ça bouge maintenant" />
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shrink-0 w-32 h-20 rounded-lg bg-[var(--os-card)] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!hasContent) {
    return (
      <section className="animate-slide-up">
        <OutsideEmptyState
          icon={Flame}
          title="Lance le mouvement"
          description="Crée le premier plan express de ta ville."
          actions={
            <Link
              href="/plans/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              Créer un plan express
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section className="animate-slide-up">
      <SectionTitle title="Ça bouge maintenant" />
      <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2">
        {lives.map((live) => (
          <Link
            key={live.id}
            href={`/live/${live.id}`}
            className="shrink-0 w-32 h-20 rounded-lg bg-gradient-to-br from-red-500 to-red-600 p-3 flex flex-col justify-between text-white hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              <span className="text-xs font-bold">LIVE</span>
            </div>
            <div>
              <p className="text-xs font-semibold line-clamp-1">{live.host?.name}</p>
              <p className="text-xs opacity-80">{live.viewerCount} spectateurs</p>
            </div>
          </Link>
        ))}
        {moments.slice(0, 2).map((moment) => (
          <Link
            key={moment.id}
            href={`/moments/${moment.id}`}
            className="shrink-0 w-32 h-20 rounded-lg relative group overflow-hidden"
          >
            <Image
              src={moment.mediaUrl}
              alt="Moment"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="128px"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-end p-2">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
