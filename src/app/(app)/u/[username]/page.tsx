export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BadgeCheck, Users } from "lucide-react";
import Link from "next/link";
import { getRelationshipStatus } from "@/lib/social/friendship";
import { getFriendCount } from "@/lib/social/friendship";
import { getTrustData } from "@/lib/trust";
import { FollowButton } from "@/components/social/follow-button";
import { FriendButton } from "@/components/social/friend-button";
import { MessageButton } from "@/components/social/message-button";
import { TrustBadge } from "@/components/trust/trust-badge";
import { TrustSignals } from "@/components/trust/trust-signals";
import { TrustReviewButton } from "@/components/trust/trust-review-button";
import { UserBadges } from "@/components/profile/user-badges";
import { ReportButton } from "@/components/report-button";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileSocialLinks } from "@/components/profile/profile-social-links";
import type { TrustData } from "@/lib/trust";
import { PublicProfileMoments, type PublicMomentItem } from "@/components/profile/public-profile-moments";
import { PublicProfileTabs } from "@/components/profile/public-profile-tabs";
import { PublicProfilePlans } from "@/components/profile/public-profile-plans";

interface Props {
  params: Promise<{ username: string }>;
}

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

function normalizeUsername(raw: string): string {
  return decodeURIComponent(raw).trim().replace(/^@/, "").toLowerCase();
}

export default async function PublicProfilePage({ params }: Props) {
  const perfLabel = "[PERF] /u/[username]";
  if (process.env.NODE_ENV !== "production") console.time(perfLabel);

  const { username: rawUsername } = await params;
  const username = normalizeUsername(rawUsername);
  if (!username || username.length < 2) notFound();

  const session = await auth().catch(() => null);
  const currentUserId = session?.user?.id;

  let user: {
    id: string; name: string | null; username: string | null;
    image: string | null; coverImage: string | null; bio: string | null;
    socialLinks: string | null; country: string | null; countryCode: string | null;
    isVerified: boolean; trustScore: number; createdAt: Date;
    homeCity: { name: string } | null; activeCity: { name: string } | null;
    userSettings: { showCityOnProfile: boolean } | null;
    proAccount: { status: string; businessName: string } | null;
  } | null = null;

  try {
    user = await db.user.findUnique({
      where: { username },
      select: {
        id: true, name: true, username: true, image: true, coverImage: true,
        bio: true, socialLinks: true, country: true, countryCode: true,
        isVerified: true, trustScore: true, createdAt: true,
        homeCity: { select: { name: true } },
        activeCity: { select: { name: true } },
        userSettings: { select: { showCityOnProfile: true } },
        proAccount: { select: { status: true, businessName: true } },
      },
    });
  } catch (err) {
    const e = err as { message?: string; code?: string; name?: string };
    console.error("[PUBLIC_PROFILE_ERROR]", { username, message: e?.message, code: e?.code, name: e?.name });
    notFound();
  }

  if (!user) notFound();

  const isSelf = currentUserId === user.id;

  let relation: string = "NONE";
  let trust = defaultTrust;
  let friendCount = 0;
  let followersCount = 0;
  let momentsCount = 0;
  let plansCount = 0;
  let recent: PublicMomentItem[] = [];
  let recentPlans: unknown[] = [];
  let friends: { id: string; name: string | null; username: string | null; image: string | null }[] = [];

  if (currentUserId) {
    try { relation = await getRelationshipStatus(currentUserId, user.id); } catch { relation = "NONE"; }
  }

  const [friendCountRes, trustRes, followersCountRes, momentsCountRes, plansCountRes, friendsRes] = await Promise.allSettled([
    getFriendCount(user.id),
    getTrustData(user.id),
    db.follow.count({ where: { followingId: user.id } }),
    db.moment.count({ where: { authorId: user.id, visibility: "PUBLIC" } }),
    db.plan.count({ where: { creatorId: user.id, status: { in: ["ACTIVE", "FULL"] } } }),
    db.friendship.findMany({
      where: { OR: [{ initiatorId: user.id }, { receiverId: user.id }] },
      include: {
        initiator: { select: { id: true, name: true, username: true, image: true } },
        receiver: { select: { id: true, name: true, username: true, image: true } },
      },
      take: 10,
    }),
  ]);

  friendCount = friendCountRes.status === "fulfilled" ? friendCountRes.value : 0;
  trust = trustRes.status === "fulfilled" ? trustRes.value : defaultTrust;
  followersCount = followersCountRes.status === "fulfilled" ? followersCountRes.value : 0;
  momentsCount = momentsCountRes.status === "fulfilled" ? momentsCountRes.value : 0;
  plansCount = plansCountRes.status === "fulfilled" ? plansCountRes.value : 0;
  if (friendsRes.status === "fulfilled") {
    friends = friendsRes.value.map((f) => (f.initiatorId === user.id ? f.receiver : f.initiator));
  }

  try {
    const moments = await db.moment.findMany({
      where: { authorId: user.id, visibility: "PUBLIC", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { createdAt: "desc" }, take: 12,
      include: {
        author: { select: { id: true, name: true, username: true, image: true, role: true, isVerified: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    recent = moments.map((m) => ({
      id: m.id, type: m.type, mediaUrl: m.mediaUrl, caption: m.caption,
      city: m.city, countryCode: m.countryCode, visibility: m.visibility,
      createdAt: m.createdAt.toISOString(), author: m.author,
      _count: { likes: m._count.likes, comments: m._count.comments },
      viewerState: { likedByMe: false, canDelete: false, canReport: currentUserId !== user.id },
    }));
  } catch { recent = []; }

  try {
    recentPlans = await db.plan.findMany({
      where: { creatorId: user.id, status: { in: ["ACTIVE", "FULL"] } },
      orderBy: { startDate: "asc" }, take: 6,
      include: {
        city: { select: { name: true } },
        creator: { select: { name: true, image: true } },
        _count: { select: { participants: true } },
      },
    });
  } catch { recentPlans = []; }

  if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);

  const showCity = isSelf || user.userSettings?.showCityOnProfile !== false;

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
          {showCity && <p>Ville: {user.activeCity?.name || user.homeCity?.name || "Non définie"}</p>}
          <p>Pays: {user.country || "Non défini"}</p>
          <p>Inscrit(e) depuis {user.createdAt?.toLocaleDateString?.("fr-FR") || ""}</p>
        </div>
      </div>
      <div className="os-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-outside-500" />
            <h2 className="text-lg font-bold text-[var(--os-fg)]">Amis ({friendCount})</h2>
          </div>
        </div>
        {friends.length === 0 ? (
          <p className="text-sm text-[var(--os-muted)]">Aucun ami pour l&rsquo;instant.</p>
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
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-4 animate-fade-in">
      <ProfileHeader
        user={user}
        showCity={showCity}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {user.proAccount?.status === "APPROVED" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-900 shadow">
                <BadgeCheck className="h-3 w-3" />
                Pro vérifié
              </span>
            )}
            <TrustBadge level={trust.badge} label={trust.badgeLabel} size="sm" showScore score={trust.trustScore} />
            {!isSelf && currentUserId && <MessageButton username={user.username || ""} />}
          </div>
        }
      />
      <ProfileStats momentsCount={momentsCount} friendsCount={friendCount} followersCount={followersCount} plansCount={plansCount} />
      <PublicProfileTabs
        moments={<PublicProfileMoments initial={recent} mode="grid" />}
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
      {!isSelf && currentUserId && (
        <div className="flex flex-col gap-3">
          <FriendButton userId={user.id} relation={relation} />
          {relation !== "FRIENDS" && relation !== "REQUEST_SENT" && relation !== "REQUEST_RECEIVED" && (
            <FollowButton userId={user.id} relation={relation} />
          )}
          <TrustReviewButton reviewedId={user.id} reviewedName={user.name || undefined} />
          <ReportButton targetType="USER" targetId={user.id} />
        </div>
      )}
      {isSelf && (
        <div className="flex flex-col gap-3">
          <Link href="/profile/edit"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
          >
            Modifier mon profil
          </Link>
        </div>
      )}
    </div>
  );
}
