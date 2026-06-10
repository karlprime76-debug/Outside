export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { AnimatedPage } from "@/components/ui/animated-page";
import Link from "next/link";
import { Users, Pencil, Shield } from "lucide-react";
import { OutsideEmptyState } from "@/components/ui/outside-empty-state";
import { TrustBadge } from "@/components/trust/trust-badge";
import { TrustSignals } from "@/components/trust/trust-signals";
import { UserBadges } from "@/components/profile/user-badges";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileSocialLinks } from "@/components/profile/profile-social-links";
import { PublicProfileMoments, type PublicMomentItem } from "@/components/profile/public-profile-moments";
import { PublicProfilePlans } from "@/components/profile/public-profile-plans";
import { PublicProfileTabs } from "@/components/profile/public-profile-tabs";
import { getTrustData } from "@/lib/trust";
import { getFriendCount } from "@/lib/social/friendship";
import type { TrustData } from "@/lib/trust";

const defaultTrust: TrustData = {
  trustScore: 0,
  badge: "new",
  badgeLabel: "Nouveau profil",
  signals: {
    hasPhoto: false,
    emailVerified: false,
    phoneVerified: false,
    accountAgeDays: 0,
    plansCreated: 0,
    plansJoined: 0,
    plansConfirmed: 0,
    positiveReviews: 0,
    reportsCount: 0,
  },
};

export default async function ProfilePage() {
  const perfLabel = "[PERF] /profile";
  if (process.env.NODE_ENV !== "production") console.time(perfLabel);

  const session = await auth();
  if (!session?.user) redirect("/login");

  let user: {
    id: string; name: string | null; username: string | null; email: string;
    image: string | null; coverImage: string | null; bio: string | null;
    socialLinks: string | null; neighborhood: string | null;
    country: string | null; language: string; preferredBudget: string | null;
    isVerified: boolean; createdAt: Date;
    homeCity: { name: string } | null; activeCity: { name: string } | null;
    trustProfile: { level: string; outsideScore: number } | null;
  } | null = null;

  try {
    if (session.user.email) {
      user = await db.user.findFirst({
        where: { email: { equals: session.user.email, mode: "insensitive" } },
        select: {
          id: true, name: true, username: true, email: true,
          image: true, coverImage: true, bio: true, socialLinks: true,
          neighborhood: true, country: true, language: true, preferredBudget: true,
          isVerified: true, createdAt: true,
          homeCity: { select: { name: true } },
          activeCity: { select: { name: true } },
          trustProfile: { select: { level: true, outsideScore: true } },
        },
      });
    }
    if (!user && session.user.id) {
      user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true, name: true, username: true, email: true,
          image: true, coverImage: true, bio: true, socialLinks: true,
          neighborhood: true, country: true, language: true, preferredBudget: true,
          isVerified: true, createdAt: true,
          homeCity: { select: { name: true } },
          activeCity: { select: { name: true } },
          trustProfile: { select: { level: true, outsideScore: true } },
        },
      });
    }
  } catch (error) {
    console.error("[PROFILE_ERROR] Failed to fetch user:", error);
    if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);
    return (
      <AnimatedPage className="p-6 max-w-2xl mx-auto">
        <div className="os-card p-8 text-center">
          <p className="text-lg font-black text-[var(--os-fg)] mb-2">Impossible de charger ton profil pour le moment.</p>
          <p className="text-sm text-[var(--os-muted)]">Un problème est survenu. Réessaie ou reviens plus tard.</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Link href="/profile" className="inline-flex items-center gap-1.5 rounded-full bg-[var(--os-card)] px-4 py-2 text-sm font-bold text-[var(--os-fg)] border border-[var(--os-card-border)] hover:bg-[var(--os-card-border)] transition-colors">Réessayer</Link>
            <Link href="/login" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all">Se reconnecter</Link>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (!user) redirect("/login");

  let friends: { id: string; name: string | null; username: string | null; image: string | null }[] = [];
  let trust = defaultTrust;
  let friendCount = 0;
  let followersCount = 0;
  let momentsCount = 0;
  let plansCount = 0;
  let recentMoments: PublicMomentItem[] = [];
  let recentPlans: unknown[] = [];

  const [friendsRes, trustRes, friendCountRes, followersCountRes, momentsCountRes, plansCountRes] = await Promise.allSettled([
    db.friendship.findMany({
      where: { OR: [{ initiatorId: user.id }, { receiverId: user.id }] },
      include: {
        initiator: { select: { id: true, name: true, username: true, image: true } },
        receiver: { select: { id: true, name: true, username: true, image: true } },
      },
      take: 10,
    }),
    getTrustData(user.id),
    getFriendCount(user.id),
    db.follow.count({ where: { followingId: user.id } }),
    db.moment.count({ where: { authorId: user.id, visibility: "PUBLIC" } }),
    db.plan.count({ where: { creatorId: user.id, status: { in: ["ACTIVE", "FULL"] } } }),
  ]);

  if (friendsRes.status === "fulfilled") {
    friends = friendsRes.value.map((f) => (f.initiatorId === user.id ? f.receiver : f.initiator));
  }
  if (trustRes.status === "fulfilled") trust = trustRes.value;
  if (friendCountRes.status === "fulfilled") friendCount = friendCountRes.value;
  if (followersCountRes.status === "fulfilled") followersCount = followersCountRes.value;
  if (momentsCountRes.status === "fulfilled") momentsCount = momentsCountRes.value;
  if (plansCountRes.status === "fulfilled") plansCount = plansCountRes.value;

  try {
    const recent = await db.moment.findMany({
      where: { authorId: user.id, visibility: "PUBLIC", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        author: { select: { id: true, name: true, username: true, image: true, role: true, isVerified: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    recentMoments = recent.map((m) => ({
      id: m.id, type: m.type, mediaUrl: m.mediaUrl, caption: m.caption,
      city: m.city, countryCode: m.countryCode, visibility: m.visibility,
      createdAt: m.createdAt.toISOString(),
      author: m.author, _count: { likes: m._count.likes, comments: m._count.comments },
      viewerState: { likedByMe: false, canDelete: true, canReport: false },
    }));
  } catch { recentMoments = []; }

  try {
    recentPlans = await db.plan.findMany({
      where: { creatorId: user.id, status: { in: ["ACTIVE", "FULL"] } },
      orderBy: { startDate: "asc" },
      take: 6,
      include: {
        city: { select: { name: true } },
        creator: { select: { name: true, image: true } },
        _count: { select: { participants: true } },
      },
    });
  } catch { recentPlans = []; }

  if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);

  const aboutTab = (
    <div className="space-y-4">
      <div className="os-card p-5">
        <h3 className="text-sm font-bold text-[var(--os-fg)] mb-3">Signaux de confiance</h3>
        <TrustSignals signals={trust.signals} compact />
      </div>
      <UserBadges userId={user.id} />
      <div className="os-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--os-fg)]">À propos</h2>
        <div className="text-sm text-[var(--os-fg)] leading-relaxed whitespace-pre-wrap">{user.bio || "Aucune bio pour le moment."}</div>
        {user.socialLinks && <ProfileSocialLinks socialLinks={user.socialLinks} />}
        <div className="text-xs text-[var(--os-muted)] space-y-1">
          {user.neighborhood && <p>Quartier: {user.neighborhood}</p>}
          {user.country && <p>Pays: {user.country}</p>}
          <p>Langue: {user.language === "fr" ? "Français" : "English"}</p>
          {user.preferredBudget && <p>Budget: {user.preferredBudget}</p>}
          <p>Inscrit(e) depuis {user.createdAt?.toLocaleDateString?.("fr-FR") || ""}</p>
        </div>
        <Link
          href="/settings/verification"
          className="inline-flex items-center gap-2 rounded-lg bg-outside-50 px-3 py-2 text-xs font-bold text-outside-700 hover:bg-outside-100 transition-colors"
        >
          <Shield className="h-3.5 w-3.5" />
          {user.isVerified ? "Identité vérifiée" : "Vérifier mon identité"}
        </Link>
      </div>
      <div className="os-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-outside-500" />
            <h2 className="text-lg font-bold text-[var(--os-fg)]">Amis ({friendCount})</h2>
          </div>
          <Link href="/friends" className="text-xs font-bold text-outside-600 hover:text-outside-700 transition-colors">Voir tout</Link>
        </div>
        {friends.length === 0 ? (
          <OutsideEmptyState icon={Users} title="Aucun ami pour l&rsquo;instant" description="Explore les plans pour rencontrer des personnes réelles." />
        ) : (
          <div className="flex flex-wrap gap-3">
            {friends.map((friend) => (
              <Link key={friend.id} href={`/u/${friend.username || ""}`}
                className="flex items-center gap-2 rounded-full border border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-2 hover:border-outside-300 transition-colors"
              >
                <img src={friend.image || "/default-avatar.png"} alt="" className="h-7 w-7 rounded-full object-cover" />
                <span className="text-sm font-semibold text-[var(--os-fg)]">{friend.name || "Anonyme"}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-4">
      <ProfileHeader
        user={user}
        isOwn
        actions={<TrustBadge level={trust.badge} label={trust.badgeLabel} size="sm" showScore score={trust.trustScore} />}
      />
      <ProfileStats momentsCount={momentsCount} friendsCount={friendCount} followersCount={followersCount} plansCount={plansCount} />
      <PublicProfileTabs
        moments={<PublicProfileMoments initial={recentMoments} mode="grid" />}
        plans={<PublicProfilePlans initial={(recentPlans as Array<Record<string, unknown>>).map((p) => ({
          id: p.id as string, title: p.title as string, mood: p.mood as string,
          planCategory: p.planCategory as string, budgetLevel: p.budgetLevel as string,
          budgetAmount: p.budgetAmount, budgetCurrency: p.budgetCurrency as string | null,
          budgetIsFrom: p.budgetIsFrom as boolean, startDate: p.startDate as unknown as string,
          maxParticipants: p.maxParticipants as number, status: p.status as string,
          city: { name: (p.city as { name: string })?.name || "" },
          creator: { name: user.name, image: user.image || undefined },
          creatorUsername: user.username || null, creatorId: user.id,
          _count: { participants: (p._count as { participants: number })?.participants || 0 },
        }))} />}
        about={aboutTab}
      />
      <div className="flex flex-col gap-3">
        <Link href="/profile/edit"
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
        >
          <Pencil className="h-4 w-4" />
          Modifier mon profil
        </Link>
        <LogoutButton />
      </div>
    </AnimatedPage>
  );
}
