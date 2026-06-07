"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { AppIcon } from "@/components/ui/app-icon";
import { MapPin, Bell, MessageCircle, Sun, Moon, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { formatUserLocation } from "@/lib/location/display-location";

interface HomeHeaderProps {
  activeCity?: { name: string } | null;
  hasNotifications?: boolean;
}

export function HomeHeader({ activeCity, hasNotifications }: HomeHeaderProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const userName = session?.user?.name ? session.user.name.split(" ")[0] : "";

  const location = formatUserLocation({
    activeCity,
    userCountry: session?.user?.country,
    userCountryCode: session?.user?.countryCode,
  });

  return (
    <header className="sticky top-0 z-40 bg-[var(--os-bg)]/95 backdrop-blur-sm border-b border-[var(--os-card-border)] pt-safe">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo + Greeting */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/home" className="flex items-center justify-center shrink-0">
              <AppIcon size={32} />
            </Link>
            <div className="min-w-0">
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
          </div>

          {/* Right: Action Icons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative p-2.5 rounded-lg hover:bg-[var(--os-card)] transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5 text-[var(--os-fg)]" />
              {hasNotifications && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-outside-500 rounded-full" />
              )}
            </Link>

            {/* DM */}
            <Link
              href="/dm"
              className="p-2.5 rounded-lg hover:bg-[var(--os-card)] transition-colors"
              title="Messages"
            >
              <MessageCircle className="h-5 w-5 text-[var(--os-fg)]" />
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-lg hover:bg-[var(--os-card)] transition-colors"
              title="Changer le thème"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-[var(--os-fg)]" />
              ) : (
                <Moon className="h-5 w-5 text-[var(--os-fg)]" />
              )}
            </button>

            {/* Profile */}
            <Link
              href="/profile"
              className="p-2.5 rounded-lg hover:bg-[var(--os-card)] transition-colors"
              title="Profil"
            >
              <Settings className="h-5 w-5 text-[var(--os-fg)]" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
