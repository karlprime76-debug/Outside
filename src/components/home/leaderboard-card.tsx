"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, ChevronRight, Crown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface LeaderboardItem {
  rank: number;
  score: number;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  level: {
    name: string;
    color: string;
  };
}

export function LeaderboardCard() {
  const [data, setData] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard?scope=global")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.leaderboard) setData(d.leaderboard.slice(0, 3));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || data.length === 0) return null;

  return (
    <Link 
      href="/leaderboard"
      className="block bg-[var(--os-card)] rounded-2xl p-4 border border-[var(--os-card-border)] hover:border-outside-500/50 transition-all pressable overflow-hidden group relative"
    >
      {/* Decorative background */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/5 blur-2xl group-hover:bg-amber-500/10 transition-all" />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[var(--os-fg)]">Classement</h3>
            <p className="text-[10px] text-[var(--os-muted)]">Découvre les meilleurs</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-[var(--os-muted)] group-hover:text-outside-500 transition-colors" />
      </div>

      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.user.id} className="flex items-center gap-3">
            <div className="w-5 flex justify-center text-xs font-black text-[var(--os-muted)]">
              {item.rank === 1 ? <Crown className="h-3.5 w-3.5 text-amber-500" /> : item.rank}
            </div>
            <Avatar src={item.user.image || ""} name={item.user.name} size="xs" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[var(--os-fg)] truncate">{item.user.name}</p>
              <p className={`text-[9px] font-black uppercase tracking-wider text-${item.level.color}-500`}>
                {item.level.name}
              </p>
            </div>
            <div className="text-[10px] font-bold text-[var(--os-muted)]">
              {Math.round(item.score)} pts
            </div>
          </div>
        ))}
      </div>
    </Link>
  );
}
