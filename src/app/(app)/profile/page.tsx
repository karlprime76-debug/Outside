import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/auth/logout-button";
import { AnimatedPage } from "@/components/ui/animated-page";
import Link from "next/link";
import { MapPin, Mail, User, Globe, Wallet, CheckCircle, Building, Users, Pencil } from "lucide-react";
import { TrustBadge } from "@/components/trust/trust-badge";
import { TrustSignals } from "@/components/trust/trust-signals";
import { getTrustData } from "@/lib/trust";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: { homeCity: true, activeCity: true },
  });

  if (!user) redirect("/login");

  const joinedPlansCount = await db.planParticipant.count({
    where: { userId: user.id },
  });

  const createdPlansCount = await db.plan.count({
    where: { creatorId: user.id },
  });

  const friendships = await db.friendship.findMany({
    where: { OR: [{ initiatorId: user.id }, { receiverId: user.id }] },
    include: {
      initiator: { select: { id: true, name: true, username: true, image: true } },
      receiver: { select: { id: true, name: true, username: true, image: true } },
    },
    take: 10,
  });

  const friends = friendships.map((f) => (f.initiatorId === user.id ? f.receiver : f.initiator));
  const trust = await getTrustData(user.id);

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Header card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-outside-500 via-outside-600 to-accent-600 p-6 text-white shadow-glow">
        <div className="relative z-10 flex items-center gap-4">
          <Avatar src={user.image} name={user.name} size="xl" />
          <div className="flex-1">
            <h1 className="text-2xl font-black">{user.name || "Utilisateur"}</h1>
            <p className="text-sm text-white/80">@{user.username || "username"}</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-white/70">
              <MapPin className="h-3.5 w-3.5" />
              <span>{user.activeCity?.name || user.homeCity?.name || "Aucune ville"}</span>
            </div>
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="os-card p-5 text-center">
          <p className="text-2xl font-black text-outside-600">{joinedPlansCount}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">Plans rejoints</p>
        </div>
        <div className="os-card p-5 text-center">
          <p className="text-2xl font-black text-accent-600">{createdPlansCount}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">Plans créés</p>
        </div>
      </div>

      {/* Info card */}
      <div className="os-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--os-fg)]">Informations</h2>
        <InfoRow icon={Mail} label="Email" value={user.email} />
        <InfoRow icon={User} label="Bio" value={user.bio || "-"} />
        <InfoRow icon={Building} label="Ville d'origine" value={user.homeCity?.name || "-"} />
        <InfoRow icon={MapPin} label="Ville active" value={user.activeCity?.name || "-"} />
        <InfoRow icon={MapPin} label="Quartier" value={user.neighborhood || "-"} />
        <InfoRow icon={Globe} label="Langue" value={user.language === "fr" ? "Français" : "English"} />
        <InfoRow icon={Wallet} label="Budget" value={user.preferredBudget || "-"} />
        <InfoRow icon={CheckCircle} label="Vérifié" value={user.isVerified ? "Oui" : "Non"} />
      </div>

      {/* Friends */}
      <div className="os-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-outside-500" />
            <h2 className="text-lg font-bold text-[var(--os-fg)]">Amis ({friends.length})</h2>
          </div>
          <Link href="/friends" className="text-xs font-bold text-outside-600 hover:text-outside-700 transition-colors">
            Voir tout
          </Link>
        </div>
        {friends.length === 0 ? (
          <p className="text-sm text-[var(--os-muted)]">Tu n&apos;as pas encore d&apos;amis. Explore les plans pour en rencontrer !</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/u/${friend.username}`}
                className="flex items-center gap-2 rounded-full border border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-2 hover:border-outside-300 transition-colors"
              >
                <Avatar src={friend.image} name={friend.name} size="sm" />
                <span className="text-sm font-semibold text-[var(--os-fg)]">{friend.name || "Anonyme"}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Link
          href="/profile/edit"
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

function InfoRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-outside-100 p-2">
        <Icon className="h-4 w-4 text-outside-600" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--os-fg)]">{value}</p>
      </div>
    </div>
  );
}
