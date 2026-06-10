"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, Sparkles } from "lucide-react";
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

  useEffect(() => {
    fetch(`/api/users/suggestions?limit=${limit}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setSuggestions(data?.suggestions || []);
      })
      .catch((err) => { console.error("[PROFILE_ERROR] Failed to fetch suggestions:", err); })
      .finally(() => setLoading(false));
  }, [limit]);

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
            {!user.viewerState.isFollowing && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  // Handle follow action
                  fetch(`/api/follow?userId=${user.id}`, { method: "POST" })
                    .then(() => {
                      setSuggestions((prev) =>
                        prev.map((u) =>
                          u.id === user.id
                            ? { ...u, viewerState: { ...u.viewerState, isFollowing: true } }
                            : u
                        )
                      );
                    })
                    .catch((err) => { console.error("[PROFILE_ERROR] Failed to follow user:", err); });
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
