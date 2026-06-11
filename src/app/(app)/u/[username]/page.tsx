export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BadgeCheck, Users } from "lucide-react";
import Link from "next/link";
import { getDictionary, type Locale } from "@/lib/i18n";
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
import { ProfilePhotos } from "@/components/profile/profile-photos";
import { ProfileActivity, type ActivityItem } from "@/components/profile/profile-activity";

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
    isVerified: boolean; trustScore: number; createdAt: Date; language: string;
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
        isVerified: true, trustScore: true, createdAt: true, language: true,
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
  const t = getDictionary(user.language as Locale);

  let relation: string = "NONE";
  let trust = defaultTrust;
  let friendCount = 0;
  let followersCount = 0;
  let momentsCount = 0;
  let plansCount = 0;
  let recent: PublicMomentItem[] = [];
  let recentPlans: unknown[] = [];
  let friends: { id: string; name: string | null; username: string | null; image: string | null }[] = [];
  let recentPhotos: { id: string; mediaUrl: string; caption: string | null; createdAt: string; _count: { reactions: number; comments: number } }[] = [];
  let activityItems: ActivityItem[] = [];

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
        _count: { select: { reactions: true, comments: true } },
      },
    });
    recent = moments.map((m) => ({
      id: m.id, type: m.type, mediaUrl: m.mediaUrl, caption: m.caption,
      city: m.city, countryCode: m.countryCode, visibility: m.visibility,
      createdAt: m.createdAt.toISOString(), author: m.author,
      _count: { reactions: m._count.reactions, comments: m._count.comments },
      viewerState: { likedByMe: false, myReaction: null, canDelete: false, canReport: currentUserId !== user.id },
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

  try {
    const photos = await db.moment.findMany({
      where: { authorId: user.id, type: "PHOTO", visibility: "PUBLIC", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { createdAt: "desc" }, take: 30,
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
    const aMoments = recent.slice(0, 5).map((m) => ({
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
      orderBy: { createdAt: "desc" }, take: 5,
      include: { receiver: { select: { name: true, image: true } } },
    });
    rawActivity.push(...aFriendships.map((f) => ({
      id: `f_${f.id}`, type: "friend" as const, label: `${t.profile.addedFriend} : ${f.receiver.name || ""}`,
      timestamp: f.createdAt, image: f.receiver.image || undefined,
    })));
    const aParticipants = await db.planParticipant.findMany({
      where: { userId: user.id, plan: { creatorId: { not: user.id } } },
      orderBy: { joinedAt: "desc" }, take: 5,
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

  const showCity = isSelf || user.userSettings?.showCityOnProfile !== false;

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
          {showCity && <p>{t.profile.city}: {user.activeCity?.name || user.homeCity?.name || t.profile.notSet}</p>}
          <p>{t.profile.country}: {user.country || t.profile.notSet}</p>
          <p>{t.profile.memberSince} {user.createdAt?.toLocaleDateString?.("fr-FR") || ""}</p>
        </div>
      </div>
      <div className="os-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-outside-500" />
            <h2 className="text-lg font-bold text-[var(--os-fg)]">{t.profile.friends} ({friendCount})</h2>
          </div>
        </div>
        {friends.length === 0 ? (
          <p className="text-sm text-[var(--os-muted)]">{t.profile.noFriends}</p>
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
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-4 animate-fade-in">
      <ProfileHeader
        user={user}
        showCity={showCity}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {user.proAccount?.status === "APPROVED" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-900 shadow">
                <BadgeCheck className="h-3 w-3" />
                Pro {t.profile.identityVerified.toLowerCase()}
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
            {t.profile.editProfile}
          </Link>
        </div>
      )}
    </div>
  );
}
