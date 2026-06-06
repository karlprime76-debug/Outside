"use client";

import { Award, ShieldCheck, MapPin, CheckCircle } from "lucide-react";

interface UserRoleBadgesProps {
  isAmbassador?: boolean | null;
  ambassadorCity?: string | null;
  isVerified?: boolean | null;
}

export function UserRoleBadges({ isAmbassador, ambassadorCity, isVerified }: UserRoleBadgesProps) {
  const badges: Array<{ icon: React.ComponentType<{ className?: string }>; label: string; variant: "gold" | "blue" | "green" }> = [];

  // Ambassadeur badge
  if (isAmbassador) {
    badges.push({
      icon: Award,
      label: ambassadorCity ? `Ambassadeur ${ambassadorCity}` : "Ambassadeur OUTSIDE",
      variant: "gold",
    });
  }

  // Vérifié badge
  if (isVerified) {
    badges.push({
      icon: CheckCircle,
      label: "Vérifié",
      variant: "green",
    });
  }

  if (badges.length === 0) return null;

  const variantStyles = {
    gold: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200",
    blue: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200",
    green: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200",
  };

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        return (
          <div
            key={index}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${variantStyles[badge.variant]}`}
          >
            <Icon className="h-3 w-3" />
            {badge.label}
          </div>
        );
      })}
    </div>
  );
}
