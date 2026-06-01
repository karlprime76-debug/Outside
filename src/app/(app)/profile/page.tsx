import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/auth/logout-button";
import { AnimatedPage } from "@/components/ui/animated-page";
import Link from "next/link";
import { MapPin, Mail, User, Globe, Wallet, CheckCircle, Building, Users } from "lucide-react";

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
      initiator: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
    },
    take: 10,
  });

  const friends = friendships.map((f) => (f.initiatorId === user.id ? f.receiver : f.initiator));

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Header card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-outside-500 via-outside-600 to-accent-600 p-6 text-white shadow-glow">
        <div className="relative z-10 flex items-center gap-4">
          <Avatar src={user.image} name={user.name} size="xl" />
          <div>
            <h1 className="text-2xl font-black">{user.name || "Utilisateur"}</h1>
            <p className="text-sm text-white/80">@{user.username || "username"}</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-white/70">
              <MapPin className="h-3.5 w-3.5" />
              <span>{user.activeCity?.name || user.homeCity?.name || "Aucune ville"}</span>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-center dark:border-surface-border dark:bg-surface-card">
          <p className="text-2xl font-black text-outside-600 dark:text-outside-400">{joinedPlansCount}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Plans rejoints</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-center dark:border-surface-border dark:bg-surface-card">
          <p className="text-2xl font-black text-accent-600 dark:text-accent-400">{createdPlansCount}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Plans créés</p>
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4 dark:border-surface-border dark:bg-surface-card">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Informations</h2>
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
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-surface-border dark:bg-surface-card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-outside-500" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Amis ({friends.length})</h2>
        </div>
        {friends.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Tu n&apos;as pas encore d&apos;amis. Explore les plans pour en rencontrer !</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/users/${friend.id}`}
                className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 hover:border-outside-300 transition-colors dark:border-surface-border dark:bg-surface-card"
              >
                <Avatar src={friend.image} name={friend.name} size="sm" />
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{friend.name || "Anonyme"}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <LogoutButton />
      </div>
    </AnimatedPage>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-outside-100 p-2 dark:bg-outside-950/20">
        <Icon className="h-4 w-4 text-outside-600 dark:text-outside-400" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
      </div>
    </div>
  );
}
