export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { getRelationshipStatus } from "@/lib/social/friendship";
import { getFriendCount } from "@/lib/social/friendship";
import { getTrustData } from "@/lib/trust";
import { FollowButton } from "@/components/social/follow-button";
import { FriendButton } from "@/components/social/friend-button";
import { TrustBadge } from "@/components/trust/trust-badge";
import { TrustSignals } from "@/components/trust/trust-signals";
import { TrustReviewButton } from "@/components/trust/trust-review-button";
import { UserBadges } from "@/components/profile/user-badges";
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

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id;

  const user = await db.user.findUnique({
    where: { username },
    include: {
      homeCity: true,
      activeCity: true,
      userSettings: { select: { showCityOnProfile: true } },
    },
  });

  if (!user) notFound();

  const isSelf = currentUserId === user.id;

  // Appels DB secondaires résilients
  let relation: string = "NONE";
  let friendCount = 0;
  let trust = defaultTrust;

  if (currentUserId) {
    try {
      relation = await getRelationshipStatus(currentUserId, user.id);
    } catch {
      relation = "NONE";
    }
  }

  try {
    friendCount = await getFriendCount(user.id);
  } catch {
    friendCount = 0;
  }

  try {
    trust = await getTrustData(user.id);
  } catch {
    trust = defaultTrust;
  }

  // Charger quelques moments publics récents (sans données sensibles)
  const recent = await db.moment.findMany({
    where: {
      authorId: user.id,
      visibility: "PUBLIC",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      author: { select: { id: true, name: true, username: true, image: true, role: true, isVerified: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  let likedSet = new Set<string>();
  if (currentUserId && recent.length > 0) {
    const likes = await db.momentLike.findMany({
      where: { userId: currentUserId, momentId: { in: recent.map((m) => m.id) } },
      select: { momentId: true },
    });
    likedSet = new Set(likes.map((l) => l.momentId));
  }

  const publicMoments: PublicMomentItem[] = recent.map((m) => ({
    id: m.id,
    type: m.type,
    mediaUrl: m.mediaUrl,
    caption: m.caption,
    city: m.city,
    countryCode: m.countryCode,
    visibility: m.visibility,
    createdAt: m.createdAt.toISOString(),
    author: m.author,
    _count: { likes: m._count.likes, comments: m._count.comments },
    viewerState: {
      likedByMe: likedSet.has(m.id),
      canDelete: currentUserId === m.authorId || session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR",
      canReport: currentUserId !== m.authorId,
    },
  }));

  // Stats basiques
  const [followersCount, momentsCount, publicPlansCount] = await Promise.all([
    db.follow.count({ where: { followingId: user.id } }),
    db.moment.count({ where: { authorId: user.id, visibility: "PUBLIC" } }),
    db.plan.count({ where: { creatorId: user.id, status: { in: ["ACTIVE", "FULL"] } } }).catch(() => 0),
  ]);

  const recentPlans = await db.plan.findMany({
    where: { creatorId: user.id, status: { in: ["ACTIVE", "FULL"] } },
    orderBy: { startDate: "asc" },
    take: 6,
    include: {
      city: { select: { name: true } },
      creator: { select: { name: true, image: true } },
      _count: { select: { participants: true } },
    },
  });

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-4 animate-fade-in">
      {/* Header card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-outside-500 via-outside-600 to-accent-600 p-6 text-white shadow-glow">
        <div className="relative z-10 flex items-center gap-4">
          <Avatar src={user.image} name={user.name} size="xl" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black truncate">{user.name || "Utilisateur OUTSIDE"}</h1>
            <p className="text-sm text-white/80 truncate">@{user.username || "username non défini"}</p>
            {(isSelf || user.userSettings?.showCityOnProfile !== false) && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-white/70">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{user.activeCity?.name || user.homeCity?.name || "Ville non définie"}</span>
              </div>
            )}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <TrustBadge badge={trust.badge} label={trust.badgeLabel} size="sm" showScore score={trust.trustScore} />
              {!isSelf && (
                <form action={`/api/dm/conversations`} method="post" className="inline-block"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const res = await fetch('/api/dm/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data.conversationId) {
                      window.location.href = `/dm/${data.conversationId}`;
                    } else {
                      alert(data.error || 'Impossible de démarrer la conversation');
                    }
                  }}
                >
                  <button type="submit" className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/30 transition-colors">Message</button>
                </form>
              )}
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Trust signals */}
      <div className="os-card p-5 animate-slide-up">
        <h3 className="text-sm font-bold text-[var(--os-fg)] mb-3">Signaux de confiance</h3>
        <TrustSignals signals={trust.signals} compact />
      </div>

      <UserBadges userId={user.id} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up">
        <div className="os-card p-5 text-center">
          <p className="text-2xl font-black text-outside-600">{momentsCount}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">Moments</p>
        </div>
        <div className="os-card p-5 text-center">
          <p className="text-2xl font-black text-outside-600">{friendCount}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">Amis</p>
        </div>
        <div className="os-card p-5 text-center">
          <p className="text-2xl font-black text-outside-600">{followersCount}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">Abonnés</p>
        </div>
        <div className="os-card p-5 text-center">
          <p className="text-2xl font-black text-outside-600">{publicPlansCount}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">Plans</p>
        </div>
      </div>

      {/* Tabs: Moments / Plans / À propos */}
      <PublicProfileTabs
        moments={<PublicProfileMoments initial={publicMoments} mode="grid" />}
        plans={<PublicProfilePlans initial={recentPlans.map((p) => ({ id: p.id, title: p.title, mood: p.mood, budgetLevel: p.budgetLevel, startDate: p.startDate as unknown as string, maxParticipants: p.maxParticipants, status: p.status, city: { name: p.city.name }, creator: { name: user.name, image: user.image || undefined }, creatorUsername: user.username || null, creatorId: user.id, _count: { participants: p._count.participants } }))} />}
        about={(
          <div className="space-y-3">
            <div className="text-sm text-[var(--os-fg)] leading-relaxed">{user.bio || "Aucune bio pour le moment."}</div>
            {(isSelf || user.userSettings?.showCityOnProfile !== false) && (
              <div className="text-xs text-[var(--os-muted)]">Ville: {user.activeCity?.name || user.homeCity?.name || "Non définie"}</div>
            )}
            <div className="text-xs text-[var(--os-muted)]">Pays: {user.country || "Non défini"}</div>
            <div className="text-xs text-[var(--os-muted)]">Inscrit(e) depuis {user.createdAt?.toLocaleDateString?.("fr-FR") || ""}</div>
          </div>
        )}
      />

      {/* Actions */}
      {!isSelf && currentUserId && (
        <div className="flex flex-col gap-3">
          <FriendButton userId={user.id} relation={relation} />
          {relation !== "FRIENDS" && relation !== "REQUEST_SENT" && relation !== "REQUEST_RECEIVED" && (
            <FollowButton userId={user.id} relation={relation} />
          )}
          <TrustReviewButton reviewedId={user.id} reviewedName={user.name || undefined} />
        </div>
      )}

      {isSelf && (
        <div className="flex flex-col gap-3">
          <Link
            href="/profile/edit"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
          >
            Modifier mon profil
          </Link>
        </div>
      )}
    </div>
  );
}
