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

interface Props {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id;

  const user = await db.user.findUnique({
    where: { username },
    include: { homeCity: true, activeCity: true, userSettings: true },
  });

  if (!user) notFound();

  const isSelf = currentUserId === user.id;
  const relation = currentUserId ? await getRelationshipStatus(currentUserId, user.id) : "NONE";
  const friendCount = await getFriendCount(user.id);
  const trust = await getTrustData(user.id);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Header card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-outside-500 via-outside-600 to-accent-600 p-6 text-white shadow-glow">
        <div className="relative z-10 flex items-center gap-4">
          <Avatar src={user.image} name={user.name} size="xl" />
          <div className="flex-1">
            <h1 className="text-2xl font-black">{user.name || "Utilisateur"}</h1>
            <p className="text-sm text-white/80">@{user.username}</p>
            {(isSelf || user.userSettings?.showCityOnProfile !== false) && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-white/70">
                <MapPin className="h-3.5 w-3.5" />
                <span>{user.activeCity?.name || user.homeCity?.name || "Aucune ville"}</span>
              </div>
            )}
            <div className="mt-3">
              <TrustBadge badge={trust.badge} label={trust.badgeLabel} size="sm" showScore score={trust.trustScore} />
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Trust signals */}
      <div className="os-card p-5">
        <h3 className="text-sm font-bold text-[var(--os-fg)] mb-3">Signaux de confiance</h3>
        <TrustSignals signals={trust.signals} compact />
      </div>

      <UserBadges userId={user.id} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="os-card p-5 text-center">
          <p className="text-2xl font-black text-outside-600">{friendCount}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">Amis</p>
        </div>
        <div className="os-card p-5 text-center">
          <p className="text-2xl font-black text-accent-600">{user.country || "—"}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">Pays</p>
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <div className="os-card p-5">
          <p className="text-sm text-[var(--os-fg)] leading-relaxed">{user.bio}</p>
        </div>
      )}

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
