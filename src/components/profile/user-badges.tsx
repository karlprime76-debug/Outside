"use client";

import { useEffect, useState } from "react";
import { Award, MapPin, Users, Globe, Utensils, PartyPopper, Plane, ShieldCheck, Dumbbell, Sun, Sparkles } from "lucide-react";

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  earnedAt: string;
}

const ICON_MAP: Record<string, typeof Award> = {
  "map-pin": MapPin,
  users: Users,
  globe: Globe,
  utensils: Utensils,
  "party-popper": PartyPopper,
  plane: Plane,
  "shield-check": ShieldCheck,
  dumbbell: Dumbbell,
  sun: Sun,
  sparkles: Sparkles,
};

export function UserBadges({ userId }: { userId: string }) {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${userId}/badges`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setBadges(data?.badges || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) return null;
  if (badges.length === 0) return null;

  return (
    <div className="os-card p-4">
      <h3 className="text-sm font-black text-[var(--os-fg)] mb-3 flex items-center gap-2">
        <Award className="h-4 w-4 text-outside-500" />
        Badges OUTSIDE
      </h3>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => {
          const Icon = ICON_MAP[badge.icon || ""] || Award;
          return (
            <div
              key={badge.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-100 to-accent-100 px-3 py-1.5 text-xs font-bold text-outside-800 border border-outside-200"
              title={badge.description}
            >
              <Icon className="h-3.5 w-3.5" />
              {badge.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
