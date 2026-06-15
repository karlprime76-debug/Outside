"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { UserPlus, Sparkles, Check } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface SuggestedUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  city: string | null;
  isVerified: boolean;
  isOfficial: boolean;
  reason: string;
  viewerState: {
    isFollowing: boolean;
  };
}

interface AccountSuggestionsProps {
  title: string;
  limit?: number;
}

export function AccountSuggestions({ title, limit = 5 }: AccountSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/users/suggestions?limit=${limit}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setSuggestions(data?.suggestions || []);
      })
      .catch((err) => { console.error("[SUGGESTIONS] Failed to fetch:", err); })
      .finally(() => setLoading(false));
  }, [limit]);

  useEffect(() => { load(); }, [load]);

  const handleFollow = (userId: string) => {
    setFollowedIds((prev) => new Set(prev).add(userId));
    fetch(`/api/follow?userId=${userId}`, { method: "POST" })
      .then(() => {
        // After a short delay, reload suggestions to get new accounts
        setTimeout(load, 800);
      })
      .catch((err) => {
        console.error("[SUGGESTIONS] Follow failed:", err);
        setFollowedIds((prev) => { const next = new Set(prev); next.delete(userId); return next; });
      });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[var(--os-fg)]">{title}</h3>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="min-w-[120px] flex-shrink-0 space-y-2">
              <div className="w-16 h-16 rounded-full bg-[var(--os-bg)] shimmer mx-auto" />
              <div className="h-3 w-20 bg-[var(--os-bg)] shimmer mx-auto rounded" />
              <div className="h-2 w-16 bg-[var(--os-bg)] shimmer mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const isFollowing = (u: SuggestedUser) => u.viewerState.isFollowing || followedIds.has(u.id);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-[var(--os-fg)] flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-outside-500" />
        {title}
      </h3>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {suggestions.map((user) => (
          <Link
            key={user.id}
            href={`/u/${user.username || user.id}`}
            className="min-w-[120px] flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl bg-[var(--os-card)] border border-[var(--os-card-border)] hover:border-outside-300 transition-colors group"
          >
            <div className="relative">
              <Avatar src={user.image} name={user.name} size="lg" />
              {user.isOfficial && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-outside-500 border-2 border-[var(--os-card)]" />
              )}
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-[var(--os-fg)] truncate w-24">
                {user.name || "Anonyme"}
              </p>
              <p className="text-[10px] text-[var(--os-muted)] truncate w-24">
                @{user.username || "user"}
              </p>
              <p className="text-[10px] text-outside-600 font-medium mt-1">
                {user.reason}
              </p>
            </div>
            {isFollowing(user) ? (
              <div className="mt-1 flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold text-green-500">
                <Check className="h-3 w-3" />
                Suivi
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleFollow(user.id);
                }}
                className="mt-1 flex items-center gap-1 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-3 py-1 text-[10px] font-bold text-white shadow-glow hover:shadow-glow-lg transition-all active:scale-95"
              >
                <UserPlus className="h-3 w-3" />
                Suivre
              </button>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
