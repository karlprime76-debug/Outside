"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Radio, Image, User, Search } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";
import { useStandaloneMode } from "@/hooks/use-standalone-mode";
import { useHaptic } from "@/hooks/use-haptic";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/home", labelKey: "home" as const, icon: Home },
  { href: "/search", labelKey: "search" as const, icon: Search },
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

  if (
    pathname.startsWith("/live/") || 
    pathname.startsWith("/moments/clips") || 
    pathname.includes("/chat") || 
    (pathname.startsWith("/dm/") && pathname !== "/dm")
  ) return null;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 pb-safe safe-bottom-nav md:hidden",
        "before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-[rgba(249,115,22,0.12)] before:to-transparent",
        "bg-[var(--os-bg)]/85 backdrop-blur-2xl",
        isStandalone && "bg-[var(--os-bg)]/92"
      )}
    >
      <div className={cn(
        "mx-auto flex max-w-md items-center justify-around px-2",
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
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-1.5 transition-all duration-200",
                "hover:opacity-80 active:scale-90",
                isActive ? "scale-105" : ""
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute -top-0.5 h-[3px] w-5 rounded-full bg-gradient-to-r from-neon-orange via-neon-rose to-neon-pink shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
              )}
              <div className={cn(
                "rounded-xl p-1.5 transition-all duration-200",
                isActive && "bg-gradient-to-b from-[rgba(249,115,22,0.06)] to-transparent"
              )}>
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive
                      ? "text-neon-orange drop-shadow-[0_0_8px_rgba(255,138,0,0.5)]"
                      : "text-[var(--os-muted)]"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold transition-all duration-200",
                  isActive
                    ? "text-neon-orange drop-shadow-[0_0_4px_rgba(255,138,0,0.3)]"
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
