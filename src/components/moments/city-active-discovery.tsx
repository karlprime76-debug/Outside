"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { UserPlus, UserCheck, MapPin } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  isVerified: boolean;
  activeCity: string | null;
  momentsCount?: number;
}

export function CityActiveDiscovery() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/users/discover?type=city-active&limit=8");
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
  }, []);

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

  if (loading) {
    return (
      <div className="py-4 px-2">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-28 rounded-2xl bg-[var(--os-card)] border border-[var(--os-card-border)] p-3 animate-pulse">
              <div className="mx-auto h-10 w-10 rounded-full bg-[var(--os-bg)]" />
              <div className="mt-2 mx-auto h-3 w-16 rounded bg-[var(--os-bg)]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) return null;

  return (
    <div className="py-4 px-2 border-b border-[var(--os-card-border)]">
      <p className="px-2 mb-2 text-xs font-bold text-[var(--os-muted)] uppercase tracking-wide flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        Actifs dans ta ville
      </p>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex-shrink-0 w-28 rounded-2xl bg-[var(--os-card)] border border-[var(--os-card-border)] p-3 flex flex-col items-center text-center"
          >
            <Link href={`/u/${user.username || user.id}`} className="flex flex-col items-center">
              <Avatar src={user.image} name={user.name} size="md" />
              <p className="mt-2 text-xs font-bold text-[var(--os-fg)] truncate w-full">
                {user.name || "Anonyme"}
              </p>
              <p className="text-[10px] text-[var(--os-muted)] truncate w-full">
                @{user.username || "user"}
              </p>
            </Link>
            <button
              onClick={() => handleFollow(user)}
              disabled={followLoading[user.id]}
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${
                followMap[user.id]
                  ? "bg-[var(--os-bg)] text-[var(--os-muted)] hover:text-[var(--os-fg)]"
                  : "bg-gradient-to-r from-outside-500 to-accent-500 text-white hover:shadow-glow"
              }`}
            >
              {followMap[user.id] ? (
                <>
                  <UserCheck className="h-3 w-3" />
                  Abonné
                </>
              ) : (
                <>
                  <UserPlus className="h-3 w-3" />
                  Suivre
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
