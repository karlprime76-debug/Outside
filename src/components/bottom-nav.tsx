"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, MapPin, Globe, User, Settings } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";

const ITEMS = [
  { href: "/home", labelKey: "home" as const, icon: Home },
  { href: "/plans", labelKey: "plans" as const, icon: Calendar },
  { href: "/places", labelKey: "places" as const, icon: MapPin },
  { href: "/passport", labelKey: "passport" as const, icon: Globe },
  { href: "/profile", labelKey: "profile" as const, icon: User },
  { href: "/settings", labelKey: "settings" as const, icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useDictionary();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200/50 bg-white/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden dark:border-surface-border/50 dark:bg-surface-dark/80">
      <div className="mx-auto flex h-[4.5rem] max-w-md items-center justify-around px-3">
        {ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 px-3 py-1.5 transition-colors"
            >
              {isActive && (
                <span className="absolute -top-1 h-1 w-6 rounded-full bg-gradient-to-r from-outside-500 to-accent-500" />
              )}
              <Icon
                className={`h-5 w-5 transition-colors ${
                  isActive
                    ? "text-outside-600 dark:text-outside-400"
                    : "text-zinc-400 dark:text-zinc-600"
                }`}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  isActive
                    ? "text-outside-600 dark:text-outside-400"
                    : "text-zinc-400 dark:text-zinc-600"
                }`}
              >
                {(t.bottomNav as Record<string, string>)[item.labelKey]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
