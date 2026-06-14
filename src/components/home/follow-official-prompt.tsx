"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { OfficialBadge } from "@/components/ui/official-badge";

interface OfficialUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  accountKind: string | null;
}

const ACCOUNT_INFO: Record<string, { name: string; reason: string }> = {
  outside_officiel: { name: "OUTSIDE Officiel", reason: "Toute l'actualité de l'app" },
  outside_guide: { name: "OUTSIDE Guide", reason: "Guides et conseils" },
};

export function FollowOfficialPrompt({ onDismiss }: { onDismiss?: () => void }) {
  const [accounts, setAccounts] = useState<OfficialUser[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const dismissed = typeof window !== "undefined" && sessionStorage.getItem("official_prompt_dismissed");

  useEffect(() => {
    fetch("/api/users/official")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAccounts(data?.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggleFollow(account: OfficialUser) {
    const isFollowing = following.has(account.id);
    const method = isFollowing ? "DELETE" : "POST" as const;
    const res = await fetch(`/api/follow?userId=${account.id}`, { method });
    if (res.ok) {
      setFollowing((prev) => {
        const next = new Set(prev);
        if (isFollowing) next.delete(account.id);
        else next.add(account.id);
        return next;
      });
    }
  }

  function handleDismiss() {
    sessionStorage.setItem("official_prompt_dismissed", "1");
    onDismiss?.();
  }

  const visible = accounts.filter((a) => !following.has(a.id));
  if (loading || dismissed || visible.length === 0) return null;

  return (
    <div className="rounded-2xl border border-outside-200/50 bg-gradient-to-br from-outside-500/5 to-accent-500/5 p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-[var(--os-fg)]">Suis les comptes officiels</h3>
        <button onClick={handleDismiss} className="text-xs text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors">
          Plus tard
        </button>
      </div>
      <div className="space-y-2">
        {visible.map((acc) => {
          const info = ACCOUNT_INFO[acc.username ?? ""];
          return (
            <Link
              key={acc.id}
              href={`/u/${acc.username}`}
              className="flex items-center gap-3 rounded-xl bg-white/50 dark:bg-white/5 p-3 hover:bg-white/80 dark:hover:bg-white/10 transition-colors group"
            >
              <Avatar src={acc.image} name={info?.name || acc.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[var(--os-fg)] truncate">{info?.name || acc.name}</span>
                  <OfficialBadge accountKind={acc.accountKind || "OFFICIAL_GUIDE"} />
                </div>
                <p className="text-xs text-[var(--os-muted)] truncate">{info?.reason || "Compte officiel"}</p>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); toggleFollow(acc); }}
                className="shrink-0 rounded-full border border-outside-300 px-3.5 py-1.5 text-xs font-bold text-outside-600 hover:bg-outside-50 dark:hover:bg-outside-900/30 transition-all group-hover:border-outside-400"
              >
                <span className="flex items-center gap-1"><UserPlus className="h-3 w-3" /> Suivre</span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
