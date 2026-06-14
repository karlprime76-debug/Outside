import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LogoutButton } from "@/components/auth/logout-button";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export const dynamic = "force-dynamic";
import { BottomNav } from "@/components/bottom-nav";
import { Avatar } from "@/components/ui/avatar";
import { UiProviders } from "@/components/ui/providers-client";
import { Bell, MessageSquare, Search } from "lucide-react";
import { getUnreadDmCount } from "@/lib/dm";
import { PushPrompt } from "@/components/push-prompt";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  let unreadCount = 0;
  let dmUnread = 0;
  if (session?.user?.id) {
    try {
      unreadCount = await db.notification.count({
        where: { recipientId: session.user.id, isRead: false },
      });
    } catch (e) {
      console.error("[UNREAD_COUNT]", e);
    }
    try {
      dmUnread = await getUnreadDmCount(session.user.id);
    } catch (e) {
      console.error("[DM_UNREAD]", e);
    }
  }

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";

  const NAV_LINKS = [
    { href: "/plans", label: "Plans" },
    { href: "/live", label: "Live" },
    { href: "/moments", label: "Moments" },
    { href: "/friends", label: "Amis" },
    { href: "/places", label: "Lieux" },
    { href: "/passport", label: "Passeport" },
    { href: "/settings", label: "Paramètres" },
    { href: "/legal", label: "Légal" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--os-bg)]">
      {/* Top header — desktop only */}
      <header className="sticky top-0 z-50 safe-header bg-[var(--os-bg)]/75 backdrop-blur-2xl border-b border-[var(--os-card-border)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-[rgba(249,115,22,0.08)] before:to-transparent">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            href="/home"
            className="text-xl font-extrabold tracking-tight gradient-text drop-shadow-[0_0_12px_rgba(255,138,0,0.4)]"
          >
            OUTSIDE
          </Link>

          {/* Mobile actions */}
          {session?.user ? (
            <div className="flex md:hidden items-center gap-1">
              <Link
                href="/search"
                aria-label="Rechercher"
                className="rounded-lg p-2.5 hover:bg-white/[0.04] transition-all duration-200 pressable"
              >
                <Search className="h-5 w-5 text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors" />
              </Link>
              <Link
                href="/activity"
                aria-label="Activité"
                className="relative rounded-lg p-2.5 hover:bg-white/[0.04] transition-all duration-200 pressable"
              >
                <Bell className="h-5 w-5 text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-neon-orange ring-[3px] ring-[var(--os-bg)] glow-pulse" />
                )}
              </Link>
              <Link
                href="/dm"
                aria-label={dmUnread > 0 ? `Messages non lus: ${dmUnread}` : "Messages"}
                className="relative rounded-lg p-2.5 hover:bg-white/[0.04] transition-all duration-200 pressable"
              >
                <MessageSquare className="h-5 w-5 text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors" />
                {dmUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-neon-orange ring-[3px] ring-[var(--os-bg)] glow-pulse" />
                )}
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="md:hidden rounded-lg bg-gradient-to-r from-neon-orange via-neon-rose to-neon-pink px-4 py-2 text-sm font-semibold text-white shadow-glow hover:shadow-glow-lg transition-all duration-200 pressable"
            >
              Se connecter
            </Link>
          )}

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 text-sm font-medium">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-[var(--os-muted)] hover:text-[var(--os-fg)] hover:bg-white/[0.04] transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
            {session?.user ? (
              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-[var(--os-card-border)]">
                <Link
                  href="/search"
                  aria-label="Rechercher"
                  className="rounded-lg p-2 hover:bg-white/[0.04] transition-all duration-200 pressable"
                >
                  <Search className="h-5 w-5 text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors" />
                </Link>
                <Link
                  href="/activity"
                  aria-label="Activité"
                  className="relative rounded-lg p-2 hover:bg-white/[0.04] transition-all duration-200 pressable"
                >
                  <Bell className="h-5 w-5 text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-neon-orange ring-[3px] ring-[var(--os-bg)] glow-pulse" />
                  )}
                </Link>
                <Link
                  href="/dm"
                  aria-label={dmUnread > 0 ? `Messages non lus: ${dmUnread}` : "Messages"}
                  className="relative rounded-lg p-2 hover:bg-white/[0.04] transition-all duration-200 pressable"
                >
                  <MessageSquare className="h-5 w-5 text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors" />
                  {dmUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-neon-orange ring-[3px] ring-[var(--os-bg)] glow-pulse" />
                  )}
                </Link>
                <Link href="/profile" className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.04] transition-all duration-200">
                  <Avatar src={session.user.image} name={session.user.name} size="sm" ring />
                  <span className="text-sm text-[var(--os-fg)] max-w-[80px] truncate">
                    {session.user.name?.split(" ")[0] || "Profil"}
                  </span>
                </Link>
                <LogoutButton />
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-2 rounded-lg bg-gradient-to-r from-neon-orange via-neon-rose to-neon-pink px-4 py-2 text-sm font-semibold text-white shadow-glow hover:shadow-glow-lg transition-all duration-200 pressable"
              >
                Se connecter
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="relative flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <UiProviders>
          <ErrorBoundary>{children}</ErrorBoundary>
          <PushPrompt />
        </UiProviders>
      </main>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
