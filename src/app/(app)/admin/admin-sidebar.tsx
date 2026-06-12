"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  Flag,
  Video,
  Music,
  Briefcase,
  Building2,
  UserCheck,
  GitBranch,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/reports", label: "Signalements", icon: Flag },
  { href: "/admin/lives", label: "Lives", icon: Video },
  { href: "/admin/audio", label: "Audio", icon: Music },
  { href: "/admin/verifications", label: "Vérifications", icon: UserCheck, adminOnly: true },
  { href: "/admin/pro-requests", label: "Demandes Pro", icon: Briefcase },
  { href: "/admin/pro/venues", label: "Lieux Pro", icon: Building2 },
  { href: "/admin/algorithm/moments", label: "Algorithme", icon: GitBranch, adminOnly: true },
];

export function AdminSidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isModerator = role === "MODERATOR";

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen flex flex-col border-r border-[var(--os-card-border)] bg-[var(--os-card)] transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className={cn("flex items-center p-4", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <Link href="/admin" className="text-sm font-black text-[var(--os-fg)] tracking-tight">
            ADMIN
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-[var(--os-muted)] hover:bg-[var(--os-bg)] transition-colors"
          title={collapsed ? "Déplier" : "Replier"}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-2">
        {NAV_ITEMS.filter((item) => !(isModerator && item.adminOnly)).map((item) => {
          const isActive = item.href === "/admin"
            ? pathname === "/admin" || pathname === "/admin/"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-outside-500/10 text-outside-600"
                  : "text-[var(--os-muted)] hover:bg-[var(--os-bg)] hover:text-[var(--os-fg)]"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("p-4 border-t border-[var(--os-card-border)]", collapsed && "flex justify-center")}>
        <Link
          href="/home"
          className="text-xs font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
        >
          {collapsed ? "↩" : "← Retour au site"}
        </Link>
      </div>
    </aside>
  );
}
