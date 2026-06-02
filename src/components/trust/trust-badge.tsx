"use client";

import { Shield, ShieldCheck, ShieldAlert, Award } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TrustBadge as TrustBadgeType } from "@/lib/trust";

const BADGE_CONFIG: Record<TrustBadgeType, { label: string; icon: typeof Shield; color: string; bg: string }> = {
  new: { label: "Nouveau", icon: ShieldAlert, color: "text-zinc-500", bg: "bg-zinc-100" },
  active: { label: "Profil actif", icon: Shield, color: "text-sky-600", bg: "bg-sky-100" },
  reliable: { label: "Fiable", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-100" },
  very_reliable: { label: "Très fiable", icon: Award, color: "text-amber-600", bg: "bg-amber-100" },
};

interface TrustBadgeProps {
  badge: TrustBadgeType;
  label?: string;
  size?: "sm" | "md";
  showScore?: boolean;
  score?: number;
}

export function TrustBadge({ badge, label, size = "md", showScore, score }: TrustBadgeProps) {
  const config = BADGE_CONFIG[badge];
  const Icon = config.icon;
  const text = label || config.label;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold",
        size === "sm" ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
        config.bg,
        config.color
      )}
      title={showScore && score !== undefined ? `Score de confiance : ${score}` : undefined}
    >
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      <span>{text}</span>
      {showScore && score !== undefined && (
        <span className="opacity-70">· {score}</span>
      )}
    </div>
  );
}
