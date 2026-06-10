"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Radio, Image, User } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";
import { useStandaloneMode } from "@/hooks/use-standalone-mode";
import { useHaptic } from "@/hooks/use-haptic";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/home", labelKey: "home" as const, icon: Home },
  { href: "/plans", labelKey: "plans" as const, icon: Calendar },
  { href: "/live", labelKey: "live" as const, icon: Radio },
  { href: "/moments", labelKey: "moments" as const, icon: Image },
  { href: "/profile", labelKey: "profile" as const, icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useDictionary();
  const mode = useStandaloneMode();
  const haptic = useHaptic();
  const isStandalone = mode !== "browser";

  if (pathname.startsWith("/live/") || pathname.startsWith("/moments/clips")) return null;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t pb-safe safe-bottom-nav backdrop-blur-xl md:hidden",
        "border-[var(--os-card-border)] bg-[var(--os-bg)]/90",
        isStandalone && "bg-[var(--os-bg)]/95 border-opacity-60"
      )}
    >
      <div className={cn(
        "mx-auto flex max-w-md items-center justify-around px-3",
        isStandalone ? "h-16" : "h-[4.5rem]"
      )}>
        {ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => haptic.light()}
              className="relative flex flex-col items-center gap-1 px-3 py-1.5 transition-colors active:scale-95"
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute -top-1 h-1 w-6 rounded-full bg-gradient-to-r from-neon-orange via-neon-rose to-neon-pink shadow-glow" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive
                    ? "text-neon-orange drop-shadow-[0_0_6px_rgba(255,138,0,0.5)]"
                    : "text-[var(--os-muted)]"
                )}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold transition-colors",
                  isActive
                    ? "text-neon-orange"
                    : "text-[var(--os-muted)]"
                )}
              >
                {t.bottomNav[item.labelKey]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
