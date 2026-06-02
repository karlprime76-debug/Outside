"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, MapPin, Users, User } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/home", labelKey: "home" as const, icon: Home },
  { href: "/plans", labelKey: "plans" as const, icon: Calendar },
  { href: "/places", labelKey: "places" as const, icon: MapPin },
  { href: "/friends", labelKey: "friends" as const, icon: Users },
  { href: "/profile", labelKey: "profile" as const, icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useDictionary();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t pb-safe safe-bottom-nav backdrop-blur-xl md:hidden",
        "border-[var(--os-card-border)] bg-[var(--os-bg)]/80"
      )}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-md items-center justify-around px-3">
        {ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 px-3 py-1.5 transition-colors pressable"
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute -top-1 h-1 w-6 rounded-full bg-gradient-to-r from-outside-500 to-accent-500" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive
                    ? "text-outside-600"
                    : "text-[var(--os-muted)]"
                )}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold transition-colors",
                  isActive
                    ? "text-outside-600"
                    : "text-[var(--os-muted)]"
                )}
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
