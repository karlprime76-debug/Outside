export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/auth/logout-button";
import { AnimatedPage } from "@/components/ui/animated-page";
import Link from "next/link";
import { MapPin, Mail, User as UserIcon, Globe, Wallet, CheckCircle, Building, Users, Pencil, Image as ImageIcon, Shield } from "lucide-react";
import { OutsideEmptyState } from "@/components/ui/outside-empty-state";
import { TrustBadge } from "@/components/trust/trust-badge";
import { TrustSignals } from "@/components/trust/trust-signals";
import { UserBadges } from "@/components/profile/user-badges";
import { getTrustData } from "@/lib/trust";
import type { TrustData } from "@/lib/trust";
import type { User } from "@prisma/client";

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
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  type UserWithCities = User & { homeCity: { name: string } | null; activeCity: { name: string } | null };
  let user: UserWithCities | null = null;
  try {
    user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { homeCity: true, activeCity: true },
    });
  } catch {
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

  // Appels DB secondaires résilients — un échec n'effondre pas la page
  let joinedPlansCount = 0;
  let createdPlansCount = 0;
  let friends: { id: string; name: string | null; username: string | null; image: string | null }[] = [];
  let trust = defaultTrust;

  try {
    [joinedPlansCount, createdPlansCount] = await Promise.all([
      db.planParticipant.count({ where: { userId: user.id } }),
      db.plan.count({ where: { creatorId: user.id } }),
    ]);
  } catch {
    // Valeurs par défaut conservées
  }

  try {
    const friendships = await db.friendship.findMany({
      where: { OR: [{ initiatorId: user.id }, { receiverId: user.id }] },
      include: {
        initiator: { select: { id: true, name: true, username: true, image: true } },
        receiver: { select: { id: true, name: true, username: true, image: true } },
      },
      take: 10,
    });
    friends = friendships.map((f) => (f.initiatorId === user.id ? f.receiver : f.initiator));
  } catch {
    // Valeur par défaut conservée
  }

  try {
    trust = await getTrustData(user.id);
  } catch {
    // Valeur par défaut conservée
  }

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6 animate-slide-up pb-24 md:pb-4">
      {/* Header card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-outside-500 via-outside-600 to-accent-600 p-6 text-white shadow-glow animate-fade-in">
        <div className="relative z-10 flex items-center gap-4">
          <Avatar src={user.image} name={user.name} size="xl" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black truncate">{user.name || "Utilisateur OUTSIDE"}</h1>
            <p className="text-sm text-white/80 truncate">@{user.username || "username non défini"}</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-white/70">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{user.activeCity?.name || user.homeCity?.name || "Ville non définie"}</span>
            </div>
            <div className="mt-3">
              <TrustBadge badge={trust.badge} label={trust.badgeLabel} size="sm" showScore score={trust.trustScore} />
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Trust signals */}
      <div className="os-card p-5 animate-slide-up animate-stagger-1">
        <h3 className="text-sm font-bold text-[var(--os-fg)] mb-3">Signaux de confiance</h3>
        <TrustSignals signals={trust.signals} compact />
      </div>

      <div className="animate-slide-up animate-stagger-2">
        <UserBadges userId={user.id} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 animate-slide-up animate-stagger-3">
        <div className="os-card p-5 text-center card-hover">
          <p className="text-2xl font-black text-outside-600">{joinedPlansCount}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">Plans rejoints</p>
        </div>
        <div className="os-card p-5 text-center card-hover">
          <p className="text-2xl font-black text-accent-600">{createdPlansCount}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">Plans créés</p>
        </div>
      </div>

      {/* Info card */}
      <div className="os-card p-6 space-y-4 animate-slide-up animate-stagger-4">
        <h2 className="text-lg font-bold text-[var(--os-fg)]">Informations</h2>
        <InfoRow icon={Mail} label="Email" value={user.email || "—"} />
        <InfoRow icon={UserIcon} label="Bio" value={user.bio || "Aucune bio pour le moment."} />
        <InfoRow icon={Building} label="Ville d'origine" value={user.homeCity?.name || "—"} />
        <InfoRow icon={MapPin} label="Ville active" value={user.activeCity?.name || "—"} />
        <InfoRow icon={MapPin} label="Quartier" value={user.neighborhood || "—"} />
        <InfoRow icon={Globe} label="Pays" value={user.country || "Pays non défini"} />
        <InfoRow icon={Globe} label="Langue" value={user.language === "fr" ? "Français" : "English"} />
        <InfoRow icon={Wallet} label="Budget" value={user.preferredBudget || "—"} />
        <InfoRow icon={CheckCircle} label="Vérifié" value={user.isVerified ? "Oui" : "Non"} />
        <Link
          href="/settings/verification"
          className="inline-flex items-center gap-2 rounded-lg bg-outside-50 px-3 py-2 text-xs font-bold text-outside-700 hover:bg-outside-100 transition-colors"
        >
          <Shield className="h-3.5 w-3.5" />
          {user.isVerified ? "Identité vérifiée" : "Vérifier mon identité"}
        </Link>
      </div>

      {/* Friends */}
      <div className="os-card p-6 animate-slide-up animate-stagger-5">
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
          <OutsideEmptyState
            icon={Users}
            title="Aucun ami pour l’instant"
            description="Explore les plans pour rencontrer des personnes réelles."
          />
        ) : (
          <div className="flex flex-wrap gap-3">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/u/${friend.username || ""}`}
                className="flex items-center gap-2 rounded-full border border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-2 hover:border-outside-300 transition-colors"
              >
                <Avatar src={friend.image} name={friend.name} size="sm" />
                <span className="text-sm font-semibold text-[var(--os-fg)]">{friend.name || "Anonyme"}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Moments */}
      <div className="os-card p-6 animate-slide-up animate-stagger-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-outside-500" />
            <h2 className="text-lg font-bold text-[var(--os-fg)]">Moments OUTSIDE</h2>
          </div>
          <Link href="/moments" className="text-xs font-bold text-outside-600 hover:text-outside-700 transition-colors">
            Voir tout
          </Link>
        </div>
        <p className="text-sm text-[var(--os-muted)] mb-4">
          Partage ce qui se passe dehors avec ta ville.
        </p>
        <div className="flex gap-2">
          <Link
            href="/moments/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
          >
            <Pencil className="h-3.5 w-3.5" />
            Ajouter un moment
          </Link>
          <Link
            href="/moments"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-2 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-colors"
          >
            Voir les moments
          </Link>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 animate-slide-up animate-stagger-7">
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
