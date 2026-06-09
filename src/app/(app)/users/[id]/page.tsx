"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import { AnimatedPage } from "@/components/ui/animated-page";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowLeft, UserPlus, UserMinus, CheckCircle, Calendar, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface UserProfile {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
  isVerified: boolean;
  homeCity: { name: string } | null;
  activeCity: { name: string } | null;
  neighborhood: string | null;
  preferredMoods: string[];
  preferredBudget: string | null;
  language: string;
  createdAt: string;
  isFriend: boolean;
}

export default function UserPage() {
  const { id } = useParams() as { id: string };
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reliability, setReliability] = useState<{ level: string; outsideScore: number; presenceScore: number; respectScore: number; plansJoined: number; plansCreated: number; positiveReviews: number } | null>(null);
  const [showReliability, setShowReliability] = useState(false);

  const isMe = session?.user?.id === id;

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`/api/users/${id}/reliability`)
      .then((r) => r.json())
      .then((data) => setReliability(data.trustProfile || null))
      .catch(() => {});
  }, [id]);

  async function toggleFriend() {
    if (!user || isMe) return;
    setActionLoading(true);
    try {
      if (user.isFriend) {
        const res = await fetch(`/api/friends/${user.id}`, { method: "DELETE" });
        if (res.ok) {
          setUser({ ...user, isFriend: false });
          addToast("Ami retiré", "success");
        }
      } else {
        const res = await fetch("/api/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        if (res.ok) {
          setUser({ ...user, isFriend: true });
          addToast("Ami ajouté", "success");
        } else if (res.status === 409) {
          addToast("Déjà ami", "info");
        }
      }
    } catch {
      addToast("Erreur réseau", "error");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingScreen size="sm" />
      </div>
    );
  }

  if (!user) {
    return (
      <AnimatedPage className="p-4 max-w-2xl mx-auto text-center">
        <p className="text-[var(--os-muted)]">Utilisateur introuvable.</p>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6">
      <Link
        href="/home"
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Avatar src={user.image} name={user.name} size="xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[var(--os-fg)] truncate">
              {user.name || "Anonyme"}
            </h1>
            {user.isVerified && <CheckCircle className="h-4 w-4 text-outside-500 shrink-0" />}
          </div>
          {user.username && (
            <p className="text-sm text-[var(--os-muted)]">@{user.username}</p>
          )}
          <p className="text-xs text-[var(--os-muted)] mt-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Inscrit en {new Date(user.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Reliability */}
      {reliability && (
        <div className="rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-4 ">
          <button
            onClick={() => setShowReliability(!showReliability)}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black uppercase tracking-wider ${
                reliability.level === "Nouveau" ? "text-[var(--os-muted)]" :
                reliability.level === "Confirmé" ? "text-blue-500" :
                reliability.level === "Fiable" ? "text-emerald-500" :
                "text-purple-500"
              }`}>
                ●
              </span>
              <span className="text-sm font-bold text-[var(--os-fg)]">
                {reliability.level}
              </span>
              <span className="text-xs text-[var(--os-muted)]">
                Score: {Math.round(reliability.outsideScore)}
              </span>
            </div>
            {showReliability ? <ChevronUp className="h-4 w-4 text-[var(--os-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--os-muted)]" />}
          </button>
          {showReliability && (
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-[var(--os-muted)]">Présence</p>
                <p className="font-semibold text-[var(--os-fg)]">{Math.round(reliability.presenceScore)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--os-muted)]">Respect</p>
                <p className="font-semibold text-[var(--os-fg)]">{Math.round(reliability.respectScore)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--os-muted)]">Plans créés</p>
                <p className="font-semibold text-[var(--os-fg)]">{reliability.plansCreated}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--os-muted)]">Plans rejoints</p>
                <p className="font-semibold text-[var(--os-fg)]">{reliability.plansJoined}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--os-muted)]">Avis positifs</p>
                <p className="font-semibold text-[var(--os-fg)]">{reliability.positiveReviews}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bio */}
      {user.bio ? (
        <p className="text-sm text-[var(--os-fg)] leading-relaxed">{user.bio}</p>
      ) : (
        <EmptyState icon={FileText} title="Pas de bio" description="Cet utilisateur n'a pas encore renseigné de bio." />
      )}

      {/* Actions */}
      {!isMe && (
        <button
          onClick={toggleFriend}
          disabled={actionLoading}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
            user.isFriend
              ? "border-2 border-[var(--os-card-border)] text-[var(--os-fg)] hover:bg-[var(--os-bg)]"
              : "bg-gradient-to-r from-outside-500 to-accent-500 text-white shadow-glow hover:shadow-glow-lg"
          } disabled:opacity-50`}
        >
          {user.isFriend ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {user.isFriend ? "Retirer des amis" : "Ajouter un ami"}
        </button>
      )}

      {/* Info */}
      <div className="rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-4 sm:p-5 space-y-3 ">
        {user.activeCity && (
          <InfoRow icon={MapPin} label="Ville active" value={user.activeCity.name} />
        )}
        {user.homeCity && (
          <InfoRow icon={MapPin} label="Ville d'origine" value={user.homeCity.name} />
        )}
        {user.neighborhood && (
          <InfoRow icon={MapPin} label="Quartier" value={user.neighborhood} />
        )}
        {user.preferredBudget && (
          <InfoRow icon={MapPin} label="Budget" value={user.preferredBudget} />
        )}
      </div>

      {/* Moods */}
      {user.preferredMoods.length > 0 && (
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--os-muted)] mb-2">
            Moods préférés
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.preferredMoods.map((m) => (
              <Badge key={m} variant="orange">{m}</Badge>
            ))}
          </div>
        </div>
      )}
    </AnimatedPage>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-outside-100 p-2 dark:bg-outside-950/20">
        <Icon className="h-4 w-4 text-outside-600 dark:text-outside-400" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--os-fg)]">{value}</p>
      </div>
    </div>
  );
}
