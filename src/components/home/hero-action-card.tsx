"use client";

import Link from "next/link";
import { MapPin, Flame, Plus } from "lucide-react";
import { ImmersiveBackground } from "@/components/ui/immersive-background";
import { backgrounds } from "@/lib/backgrounds";
import { formatCityName } from "@/lib/location/display-location";

interface HeroActionCardProps {
  activeCity?: { name: string } | null;
}

export function HeroActionCard({ activeCity }: HeroActionCardProps) {
  return (
    <ImmersiveBackground
      daySrc={backgrounds.home.day}
      nightSrc={backgrounds.home.night}
      alt="Home background"
      overlay="brand"
      height="section"
      className="rounded-3xl shadow-glow animate-slide-up"
    >
      <div className="flex flex-1 flex-col justify-center p-6">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-white/90" />
          {activeCity ? (
            <span className="text-3xl font-black tracking-tight text-white drop-shadow-lg">
              {formatCityName(activeCity)}
            </span>
          ) : (
            <span className="text-3xl font-black tracking-tight text-white/80 drop-shadow-lg">
              Choisis ta ville
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-white/70 max-w-md">
          {activeCity
            ? `${formatCityName(activeCity)} est actif ce soir.`
            : "Définis ta ville pour voir les plans autour de toi."}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href="/tonight"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors pressable"
          >
            <Flame className="h-4 w-4" />
            Qui bouge ce soir ?
          </Link>
          <Link
            href="/plans/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors pressable"
          >
            <Plus className="h-4 w-4" />
            Créer un plan
          </Link>
        </div>
      </div>
    </ImmersiveBackground>
  );
}
