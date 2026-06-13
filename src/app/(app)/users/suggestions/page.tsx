"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Avatar } from "@/components/ui/avatar";
import { ArrowLeft, Users, Loader2 } from "lucide-react";

interface SuggestedUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  city: string | null;
  isVerified: boolean;
  isOfficial: boolean;
  reason: string;
}

export default function UsersSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/suggestions")
      .then((res) => res.json())
      .then((data) => setSuggestions(data.suggestions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-4 animate-slide-up">
      <Link
        href="/friends"
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux amis
      </Link>

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
          <Users className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-black text-[var(--os-fg)]">Suggestions</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--os-muted)]" />
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-12 text-[var(--os-muted)]">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-bold">Aucune suggestion pour le moment</p>
          <p className="text-sm">Invite des amis ou explore les plans pour rencontrer du monde.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((user) => (
            <Link
              key={user.id}
              href={`/u/${user.username || user.id}`}
              className="os-card p-4 flex items-center gap-3 card-hover transition-colors"
            >
              <Avatar src={user.image} name={user.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--os-fg)] truncate">{user.name || "Anonyme"}</p>
                <p className="text-xs text-[var(--os-muted)]">@{user.username || "?"}</p>
                <p className="text-xs text-[var(--os-muted)] mt-0.5">{user.reason}{user.city ? ` · ${user.city}` : ""}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
