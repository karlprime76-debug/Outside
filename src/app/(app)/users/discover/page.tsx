"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { Compass, UserPlus, UserCheck, Loader2, Star, MapPin } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  isVerified: boolean;
  activeCity: string | null;
  momentsCount: number;
}

type Tab = "creators" | "around";

export default function UsersDiscoverPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("creators");
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function load() {
      try {
        const res = await fetch(`/api/users/discover?type=${tab}&limit=20`);
        const data = await res.json();
        if (!cancelled) {
          setUsers(data.users || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tab]);

  const handleFollow = async (user: User) => {
    if (followLoading[user.id]) return;
    setFollowLoading((prev) => ({ ...prev, [user.id]: true }));
    const next = !followMap[user.id];
    setFollowMap((prev) => ({ ...prev, [user.id]: next }));
    try {
      const res = await fetch(`/api/follow?userId=${user.id}`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) {
        setFollowMap((prev) => ({ ...prev, [user.id]: !next }));
      } else {
        addToast(next ? "Abonnement confirmé" : "Désabonnement confirmé", "success");
      }
    } catch {
      setFollowMap((prev) => ({ ...prev, [user.id]: !next }));
    } finally {
      setFollowLoading((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  return (
    <AnimatedPage className="pb-24">
      <div className="sticky top-0 z-30 bg-[var(--os-bg)]/80 backdrop-blur-md border-b border-[var(--os-card-border)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-black text-[var(--os-fg)]">Découvrir des comptes</h1>
        </div>
        <div className="flex gap-1 px-4 pb-3">
          <button
            onClick={() => setTab("creators")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
              tab === "creators"
                ? "bg-gradient-to-r from-outside-500 to-accent-500 text-white shadow-glow"
                : "text-[var(--os-muted)] hover:text-[var(--os-fg)] bg-[var(--os-card)]"
            }`}
          >
            <Star className="h-3.5 w-3.5" />
            Créateurs
          </button>
          <button
            onClick={() => setTab("around")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
              tab === "around"
                ? "bg-gradient-to-r from-outside-500 to-accent-500 text-white shadow-glow"
                : "text-[var(--os-muted)] hover:text-[var(--os-fg)] bg-[var(--os-card)]"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            Autour de moi
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--os-muted)]" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <Compass className="h-12 w-12 text-[var(--os-muted)] mx-auto mb-4" />
            <p className="text-[var(--os-muted)]">Aucun compte à découvrir pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-2xl bg-[var(--os-card)] border border-[var(--os-card-border)] p-4 flex flex-col items-center text-center"
              >
                <Link href={`/u/${user.username || user.id}`} className="flex flex-col items-center">
                  <Avatar src={user.image} name={user.name} size="lg" />
                  <p className="mt-2 text-sm font-bold text-[var(--os-fg)] truncate max-w-full">
                    {user.name || "Anonyme"}
                  </p>
                  <p className="text-xs text-[var(--os-muted)] truncate max-w-full">
                    @{user.username || "user"}
                  </p>
                  {user.activeCity && (
                    <p className="text-xs text-outside-500 mt-0.5">{user.activeCity}</p>
                  )}
                  {user.momentsCount > 0 && (
                    <p className="text-xs font-semibold text-[var(--os-muted)] mt-0.5">
                      {user.momentsCount} moment{user.momentsCount > 1 ? "s" : ""}
                    </p>
                  )}
                </Link>
                <button
                  onClick={() => handleFollow(user)}
                  disabled={followLoading[user.id]}
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    followMap[user.id]
                      ? "bg-[var(--os-bg)] text-[var(--os-muted)] hover:text-[var(--os-fg)]"
                      : "bg-gradient-to-r from-outside-500 to-accent-500 text-white hover:shadow-glow"
                  }`}
                >
                  {followMap[user.id] ? (
                    <>
                      <UserCheck className="h-3.5 w-3.5" />
                      Abonné
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      Suivre
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
