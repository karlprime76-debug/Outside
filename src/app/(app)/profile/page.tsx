export const dynamic = "force-dynamic";

import { ErrorBoundary } from "@/components/ui/error-boundary";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { AnimatedPage } from "@/components/ui/animated-page";
import Link from "next/link";
import { Users, Pencil, Shield, LayoutDashboard, Trophy, Group, Wallet } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";
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
import { ProfilePhotos } from "@/components/profile/profile-photos";
import { ProfileActivity, type ActivityItem } from "@/components/profile/profile-activity";
import { getTrustData } from "@/lib/trust";
import { getFriendCount } from "@/lib/social/friendship";
import { getUserQualityScore } from "@/lib/algorithm/user-quality-score";
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

  let t = getDictionary("fr");

  let user: {
    id: string; name: string | null; username: string | null; email: string;
    image: string | null; coverImage: string | null; bio: string | null;
    socialLinks: string | null; neighborhood: string | null;
    country: string | null; language: string; preferredBudget: string | null;
    isVerified: boolean; role: string; createdAt: Date;
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
          isVerified: true, role: true, createdAt: true,
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
          isVerified: true, role: true, createdAt: true,
          homeCity: { select: { name: true } },
          activeCity: { select: { name: true } },
          trustProfile: { select: { level: true, outsideScore: true } },
        },
      });
    }
  } catch {
    console.error("[PROFILE_ERROR] Failed to fetch user:");
    if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);
    return (
      <AnimatedPage className="p-6 max-w-2xl mx-auto">
        <div className="os-card p-8 text-center">
          <p className="text-lg font-black text-[var(--os-fg)] mb-2">{t.profile.loadError}</p>
          <p className="text-sm text-[var(--os-muted)]">{t.profile.loadErrorDesc}</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Link href="/profile" className="inline-flex items-center gap-1.5 rounded-full bg-[var(--os-card)] px-4 py-2 text-sm font-bold text-[var(--os-fg)] border border-[var(--os-card-border)] hover:bg-[var(--os-card-border)] transition-colors">{t.profile.retry}</Link>
            <Link href="/login" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all">{t.profile.reconnect}</Link>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (!user) redirect("/login");

  t = getDictionary(user.language as Locale);

  let friends: { id: string; name: string | null; username: string | null; image: string | null }[] = [];
  let trust = defaultTrust;
  let friendCount = 0;
  let followersCount = 0;
  let momentsCount = 0;
  let plansCount = 0;
  let qualityScore = 50;
  let recentMoments: PublicMomentItem[] = [];
  let recentPlans: unknown[] = [];
  let recentPhotos: { id: string; mediaUrl: string; caption: string | null; createdAt: string; _count: { reactions: number; comments: number } }[] = [];
  let activityItems: ActivityItem[] = [];

  const [friendsRes, trustRes, friendCountRes, followersCountRes, momentsCountRes, plansCountRes, qualityScoreRes] = await Promise.allSettled([
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
    getUserQualityScore(user.id),
  ]);

  if (friendsRes.status === "fulfilled") {
    friends = friendsRes.value.map((f) => (f.initiatorId === user.id ? f.receiver : f.initiator));
  }
  if (trustRes.status === "fulfilled") trust = trustRes.value;
  if (friendCountRes.status === "fulfilled") friendCount = friendCountRes.value;
  if (followersCountRes.status === "fulfilled") followersCount = followersCountRes.value;
  if (momentsCountRes.status === "fulfilled") momentsCount = momentsCountRes.value;
  if (plansCountRes.status === "fulfilled") plansCount = plansCountRes.value;
  if (qualityScoreRes.status === "fulfilled") qualityScore = qualityScoreRes.value;

  try {
    const recent = await db.moment.findMany({
      where: { authorId: user.id, visibility: "PUBLIC", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        author: { select: { id: true, name: true, username: true, image: true, role: true, isVerified: true } },
        _count: { select: { reactions: true, comments: true } },
      },
    });
    recentMoments = recent.map((m) => ({
      id: m.id, type: m.type, mediaUrl: m.mediaUrl, caption: m.caption,
      city: m.city, countryCode: m.countryCode, visibility: m.visibility,
      createdAt: m.createdAt.toISOString(),
      author: m.author,       _count: { reactions: m._count.reactions, comments: m._count.comments },
      viewerState: { likedByMe: false, myReaction: null, canDelete: true, canReport: false },
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

  try {
    const photos = await db.moment.findMany({
      where: { authorId: user.id, type: "PHOTO", visibility: "PUBLIC", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { _count: { select: { reactions: true, comments: true } } },
    });
    recentPhotos = photos.map((p) => ({
      id: p.id, mediaUrl: p.mediaUrl, caption: p.caption,
      createdAt: p.createdAt.toISOString(),
      _count: { reactions: p._count.reactions, comments: p._count.comments },
    }));
  } catch { recentPhotos = []; }

  try {
    const rawActivity: { id: string; type: ActivityItem["type"]; label: string; timestamp: Date; image?: string }[] = [];
    const aMoments = recentMoments.slice(0, 5).map((m) => ({
      id: `m_${m.id}`, type: "moment" as const, label: t.profile.publishedMoment,
      timestamp: new Date(m.createdAt), image: m.mediaUrl,
    }));
    rawActivity.push(...aMoments);
    const aPlans = (recentPlans as Array<Record<string, unknown>>).slice(0, 5).map((p) => ({
      id: `pc_${p.id as string}`, type: "plan_created" as const, label: t.profile.createdPlan,
      timestamp: new Date((p as { createdAt: string }).createdAt || Date.now()),
    }));
    rawActivity.push(...aPlans);
    const aFriendships = await db.friendship.findMany({
      where: { initiatorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { receiver: { select: { name: true, image: true } } },
    });
    rawActivity.push(...aFriendships.map((f) => ({
      id: `f_${f.id}`, type: "friend" as const, label: `${t.profile.addedFriend} : ${f.receiver.name || ""}`,
      timestamp: f.createdAt, image: f.receiver.image || undefined,
    })));
    const aParticipants = await db.planParticipant.findMany({
      where: { userId: user.id, plan: { creatorId: { not: user.id } } },
      orderBy: { joinedAt: "desc" },
      take: 5,
      include: { plan: { select: { title: true } } },
    });
    rawActivity.push(...aParticipants.map((p) => ({
      id: `pj_${p.id}`, type: "plan_joined" as const, label: `${t.profile.joinedPlan} : ${p.plan?.title || ""}`,
      timestamp: p.joinedAt,
    })));
    rawActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    activityItems = rawActivity.slice(0, 20).map((a) => ({
      id: a.id, type: a.type, label: a.label,
      timestamp: a.timestamp.toISOString(), image: a.image,
    }));
  } catch { activityItems = []; }

  if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);

  const aboutTab = (
    <div className="space-y-4">
      <div className="os-card p-5">
        <h3 className="text-sm font-bold text-[var(--os-fg)] mb-3">{t.profile.trustSignals}</h3>
        <TrustSignals signals={trust.signals} compact />
      </div>
      <UserBadges userId={user.id} />
      <div className="os-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--os-fg)]">{t.profile.aboutSection}</h2>
        <div className="text-sm text-[var(--os-fg)] leading-relaxed whitespace-pre-wrap">{user.bio || t.profile.noBio}</div>
        {user.socialLinks && <ProfileSocialLinks socialLinks={user.socialLinks} />}
        <div className="text-xs text-[var(--os-muted)] space-y-1">
          {user.neighborhood && <p>{t.profile.neighborhood}: {user.neighborhood}</p>}
          {user.country && <p>{t.profile.country}: {user.country}</p>}
          {user.preferredBudget && <p>{t.profile.budget}: {user.preferredBudget}</p>}
          <p>{t.profile.memberSince} {user.createdAt?.toLocaleDateString?.("fr-FR") || ""}</p>
        </div>
        <Link
          href="/settings/verification"
          className="inline-flex items-center gap-2 rounded-lg bg-outside-50 px-3 py-2 text-xs font-bold text-outside-700 hover:bg-outside-100 transition-colors"
        >
          <Shield className="h-3.5 w-3.5" />
          {user.isVerified ? t.profile.identityVerified : t.profile.verifyIdentity}
        </Link>
      </div>
      <div className="os-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-outside-500" />
            <h2 className="text-lg font-bold text-[var(--os-fg)]">{t.profile.friends} ({friendCount})</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/leaderboard" className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">
              <Trophy className="h-3 w-3" />
              Classement
            </Link>
            <Link href="/friends" className="text-xs font-bold text-outside-600 hover:text-outside-700 transition-colors">{t.profile.seeAll}</Link>
          </div>
        </div>
        {friends.length === 0 ? (
          <OutsideEmptyState icon={Users} title={t.profile.noFriends} description={t.profile.noFriendsDesc} />
        ) : (
          <div className="flex flex-wrap gap-3">
            {friends.map((friend) => (
              <Link key={friend.id} href={`/u/${friend.username || ""}`}
                className="flex items-center gap-2 rounded-full border border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-2 hover:border-outside-300 transition-colors"
              >
                <img src={friend.image || "/default-avatar.png"} alt="" className="h-7 w-7 rounded-full object-cover" />
                <span className="text-sm font-semibold text-[var(--os-fg)]">{friend.name || t.plans.anonymous}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-4">
      <ProfileHeader
        user={user}
        qualityScore={qualityScore}
        isOwn
        actions={<TrustBadge level={trust.badge} label={trust.badgeLabel} size="sm" showScore score={trust.trustScore} />}
      />
      <ProfileStats momentsCount={momentsCount} friendsCount={friendCount} followersCount={followersCount} plansCount={plansCount} />
      <PublicProfileTabs
        moments={<PublicProfileMoments initial={recentMoments} mode="grid" />}
        photos={<ProfilePhotos initial={recentPhotos} noPhotos={t.profile.noPhotos} noPhotosDesc={t.profile.noPhotosDesc} />}
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
        activity={<ProfileActivity initial={activityItems} noActivity={t.profile.noActivity} noActivityDesc={t.profile.noActivityDesc} justNow={t.profile.justNow} minutes={t.profile.minutes} hours={t.profile.hours} days={t.profile.days} />}
        about={aboutTab}
        momentsLabel={t.profile.moments}
        photosLabel={t.profile.photos}
        plansLabel={t.profile.plans}
        activityLabel={t.profile.activity}
        aboutLabel={t.profile.about}
      />
      <div className="flex flex-col gap-3">
        <Link href="/circles"
          className="flex items-center justify-center gap-2 rounded-xl bg-[var(--os-card)] border border-[var(--os-card-border)] px-4 py-3 text-sm font-bold text-[var(--os-fg)] hover:border-outside-500 transition-all pressable"
        >
          <Group className="h-4 w-4 text-outside-500" />
          Mes cercles privés
        </Link>
        {(user.role === "PRO" || user.role === "ADMIN") && (
          <Link href="/pro/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--os-card)] border border-[var(--os-card-border)] px-4 py-3 text-sm font-bold text-[var(--os-fg)] hover:border-outside-500 transition-all pressable"
          >
            <LayoutDashboard className="h-4 w-4 text-outside-500" />
            Dashboard PRO
          </Link>
        )}
        <Link href="/profile/edit"
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
        >
          <Pencil className="h-4 w-4" />
          {t.profile.editProfile}
        </Link>
        <Link href="/profile/wallet"
          className="flex items-center justify-center gap-2 rounded-xl bg-[var(--os-card)] border border-[var(--os-card-border)] px-4 py-3 text-sm font-bold text-[var(--os-fg)] hover:border-outside-500 transition-all pressable"
        >
          <Wallet className="h-4 w-4 text-outside-500" />
          Mon Portefeuille (Billets)
        </Link>
        <LogoutButton />
      </div>
    </AnimatedPage>
    </ErrorBoundary>
  );
}
