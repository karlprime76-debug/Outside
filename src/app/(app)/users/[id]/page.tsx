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
import { MapPin, ArrowLeft, UserPlus, UserMinus, CheckCircle, Calendar } from "lucide-react";

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

  const isMe = session?.user?.id === id;

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
        <p className="text-zinc-500 dark:text-zinc-400">Utilisateur introuvable.</p>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6">
      <Link
        href="/home"
        className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Avatar src={user.image} name={user.name} size="xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 truncate">
              {user.name || "Anonyme"}
            </h1>
            {user.isVerified && <CheckCircle className="h-4 w-4 text-outside-500 shrink-0" />}
          </div>
          {user.username && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">@{user.username}</p>
          )}
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Inscrit en {new Date(user.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{user.bio}</p>
      )}

      {/* Actions */}
      {!isMe && (
        <button
          onClick={toggleFriend}
          disabled={actionLoading}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
            user.isFriend
              ? "border-2 border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              : "bg-gradient-to-r from-outside-500 to-accent-500 text-white shadow-glow hover:shadow-glow-lg"
          } disabled:opacity-50`}
        >
          {user.isFriend ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {user.isFriend ? "Retirer des amis" : "Ajouter en ami"}
        </button>
      )}

      {/* Info */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3 dark:border-surface-border dark:bg-surface-card">
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
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
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
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
      </div>
    </div>
  );
}
