"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { AppIcon } from "@/components/ui/app-icon";
import { MapPin, Flame } from "lucide-react";
import { formatUserLocation } from "@/lib/location/display-location";
import { useStreak } from "@/hooks/use-streak";

interface HomeHeaderProps {
  activeCity?: { name: string } | null;
}

export function HomeHeader({ activeCity }: HomeHeaderProps) {
  const { data: session } = useSession();
  const { streak } = useStreak();

  const userName = session?.user?.name ? session.user.name.split(" ")[0] : "";

  const location = formatUserLocation({
    activeCity,
    userCountry: session?.user?.country,
    userCountryCode: session?.user?.countryCode,
  });

  return (
    <div className="border-b border-[var(--os-card-border)] bg-[var(--os-bg)]">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/home" className="flex items-center justify-center shrink-0">
            <AppIcon size={32} />
          </Link>
          <div className="min-w-0 flex-1">
            {userName && (
              <p className="text-sm font-semibold text-[var(--os-fg)] truncate">
                Bonjour {userName}
              </p>
            )}
            {location && (
              <div className="flex items-center gap-1 text-xs text-[var(--os-muted)] truncate">
                <MapPin className="h-3 w-3 text-outside-500 shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            )}
            {!location && (
              <p className="text-xs text-[var(--os-muted)]">Choisis ta ville</p>
            )}
          </div>
          {streak.currentStreak > 0 && (
            <Link
              href="/activity"
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 px-3 py-1.5 shrink-0 hover:bg-orange-500/20 transition-colors"
            >
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-600">
                {streak.currentStreak}
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
