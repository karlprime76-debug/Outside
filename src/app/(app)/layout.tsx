import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LogoutButton } from "@/components/auth/logout-button";

export const dynamic = "force-dynamic";
import { BottomNav } from "@/components/bottom-nav";
import { Avatar } from "@/components/ui/avatar";
import { UiProviders } from "@/components/ui/providers-client";
import { ThemeBadge } from "@/components/theme-toggle";
import { Bell, MessageSquare } from "lucide-react";
import { getUnreadDmCount } from "@/lib/dm";

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
    } catch {}
    try {
      dmUnread = await getUnreadDmCount(session.user.id);
    } catch {}
  }

  const NAV_LINKS = [
    { href: "/plans", label: "Plans" },
    { href: "/live", label: "Live" },
    { href: "/moments", label: "Moments" },
    { href: "/friends", label: "Amis" },
    { href: "/places", label: "Lieux" },
    { href: "/passport", label: "Passeport" },
    { href: "/settings", label: "Paramètres" },
    { href: "/legal", label: "Légal" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--os-bg)]">
      {/* Top header */}
      <header className="sticky top-0 z-50 border-b border-[var(--os-card-border)] glass safe-header">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            href="/home"
            className="text-xl font-extrabold tracking-tight gradient-text"
          >
            OUTSIDE
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-[var(--os-muted)] hover:bg-[var(--os-card-border)] hover:text-[var(--os-fg)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {session?.user ? (
              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-[var(--os-card-border)]">
                <Link
                  href="/activity"
                  aria-label="Activité"
                  className="relative rounded-lg p-2 hover:bg-[var(--os-card-border)] transition-colors pressable"
                >
                  <Bell className="h-5 w-5 text-[var(--os-muted)]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-outside-500 ring-2 ring-[var(--os-bg)] glow-pulse" />
                  )}
                </Link>
                <Link
                  href="/dm"
                  aria-label={dmUnread > 0 ? `Messages non lus: ${dmUnread}` : "Messages"}
                  className="relative rounded-lg p-2 hover:bg-[var(--os-card-border)] transition-colors pressable"
                >
                  <MessageSquare className="h-5 w-5 text-[var(--os-muted)]" />
                  {dmUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-outside-500 ring-2 ring-[var(--os-bg)] glow-pulse" />
                  )}
                </Link>
                <ThemeBadge />
                <Link href="/profile" className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--os-card-border)] transition-colors">
                  <Avatar src={session.user.image} name={session.user.name} size="sm" />
                  <span className="text-sm text-[var(--os-fg)]">
                    {session.user.name?.split(" ")[0] || "Profil"}
                  </span>
                </Link>
                <LogoutButton />
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-2 rounded-lg bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
              >
                Se connecter
              </Link>
            )}
          </nav>

          {/* Mobile: notifications + avatar or login */}
          <div className="flex md:hidden items-center gap-2">
            {session?.user ? (
              <>
                <Link
                  href="/activity"
                  aria-label="Activité"
                  className="relative rounded-lg p-2 hover:bg-[var(--os-card-border)] transition-colors pressable"
                >
                  <Bell className="h-5 w-5 text-[var(--os-muted)]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-outside-500 ring-2 ring-[var(--os-bg)] glow-pulse" />
                  )}
                </Link>
                <Link
                  href="/dm"
                  aria-label={dmUnread > 0 ? `Messages non lus: ${dmUnread}` : "Messages"}
                  className="relative rounded-lg p-2 hover:bg-[var(--os-card-border)] transition-colors pressable"
                >
                  <MessageSquare className="h-5 w-5 text-[var(--os-muted)]" />
                  {dmUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-outside-500 ring-2 ring-[var(--os-bg)] glow-pulse" />
                  )}
                </Link>
                <ThemeBadge />
                <Link href="/profile">
                  <Avatar src={session.user.image} name={session.user.name} size="sm" />
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold text-outside-600"
              >
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <UiProviders>{children}</UiProviders>
      </main>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
