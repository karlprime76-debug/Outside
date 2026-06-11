"use client";

import { useState, useEffect } from "react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Globe, ChevronRight, Crown, Medal, TrendingUp } from "lucide-react";
import Link from "next/link";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface LeaderboardItem {
  rank: number;
  score: number;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    isVerified: boolean;
  };
  level: {
    level: number;
    name: string;
    color: string;
  };
}

export default function LeaderboardPage() {
  const [scope, setScope] = useState<"global" | "friends">("friends");
  const [data, setData] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?scope=${scope}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.leaderboard) setData(d.leaderboard);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [scope]);

  return (
    <AnimatedPage className="pb-24">
      <div className="bg-gradient-to-b from-outside-500/20 to-transparent px-4 pt-8 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[var(--os-fg)] flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              Classement
            </h1>
            <p className="text-sm text-[var(--os-muted)]">Les meilleurs d&apos;OUTSIDE</p>
          </div>
          <div className="flex bg-[var(--os-card)] p-1 rounded-xl border border-[var(--os-card-border)]">
            <button
              onClick={() => setScope("friends")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scope === "friends"
                  ? "bg-outside-500 text-white shadow-glow"
                  : "text-[var(--os-muted)] hover:text-[var(--os-fg)]"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Amis
            </button>
            <button
              onClick={() => setScope("global")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scope === "global"
                  ? "bg-outside-500 text-white shadow-glow"
                  : "text-[var(--os-muted)] hover:text-[var(--os-fg)]"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              Global
            </button>
          </div>
        </div>

        {/* Top 3 Podium (conceptuel) */}
        {!loading && data.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-8 pt-4">
            {/* Rank 2 */}
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <Avatar src={data[1].user.image || ""} name={data[1].user.name} size="lg" className="border-2 border-slate-300 shadow-lg" />
                <div className="absolute -bottom-1 -right-1 bg-slate-300 text-slate-800 rounded-full h-6 w-6 flex items-center justify-center text-xs font-black border-2 border-[var(--os-bg)]">2</div>
              </div>
              <p className="text-[10px] font-bold text-[var(--os-fg)] max-w-[60px] truncate">{data[1].user.name}</p>
              <div className="h-16 w-12 bg-slate-400/20 rounded-t-lg mt-2 flex items-start justify-center pt-2">
                <Medal className="h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Rank 1 */}
            <div className="flex flex-col items-center">
              <Crown className="h-6 w-6 text-amber-500 mb-1 animate-bounce" />
              <div className="relative mb-2">
                <Avatar src={data[0].user.image || ""} name={data[0].user.name} size="xl" className="border-4 border-amber-500 shadow-glow" />
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full h-8 w-8 flex items-center justify-center text-sm font-black border-2 border-[var(--os-bg)]">1</div>
              </div>
              <p className="text-xs font-black text-[var(--os-fg)] max-w-[80px] truncate">{data[0].user.name}</p>
              <div className="h-24 w-16 bg-amber-500/20 rounded-t-xl mt-2 flex items-start justify-center pt-4">
                <TrendingUp className="h-6 w-6 text-amber-500" />
              </div>
            </div>

            {/* Rank 3 */}
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <Avatar src={data[2].user.image || ""} name={data[2].user.name} size="lg" className="border-2 border-amber-700 shadow-lg" />
                <div className="absolute -bottom-1 -right-1 bg-amber-700 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-black border-2 border-[var(--os-bg)]">3</div>
              </div>
              <p className="text-[10px] font-bold text-[var(--os-fg)] max-w-[60px] truncate">{data[2].user.name}</p>
              <div className="h-12 w-12 bg-amber-700/20 rounded-t-lg mt-2 flex items-start justify-center pt-2">
                <Medal className="h-4 w-4 text-amber-700" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 -mt-6">
        <div className="bg-[var(--os-card)] rounded-3xl border border-[var(--os-card-border)] overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 flex justify-center">
              <LoadingScreen size="sm" />
            </div>
          ) : data.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="h-12 w-12 text-[var(--os-muted)] mx-auto mb-4 opacity-20" />
              <p className="text-[var(--os-muted)]">Aucune donnée disponible</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--os-card-border)]">
              {data.map((item) => (
                <Link
                  key={item.user.id}
                  href={`/profile/${item.user.username || item.user.id}`}
                  className="flex items-center gap-4 px-4 py-4 hover:bg-[var(--os-bg)] transition-colors group"
                >
                  <div className="w-8 flex justify-center font-black text-lg text-[var(--os-muted)] group-hover:text-outside-500 transition-colors">
                    {item.rank}
                  </div>
                  <Avatar src={item.user.image || ""} name={item.user.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-[var(--os-fg)] truncate">{item.user.name}</h3>
                      {item.user.isVerified && (
                        <Badge variant="blue" className="px-1 py-0 h-4">
                          <Medal className="h-2.5 w-2.5" />
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider text-${item.level.color}-500`}>
                        {item.level.name}
                      </span>
                      <span className="text-[10px] text-[var(--os-muted)]">•</span>
                      <span className="text-[10px] font-bold text-[var(--os-muted)]">
                        {Math.round(item.score)} pts
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--os-muted)] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="bg-outside-500/10 rounded-2xl p-4 border border-outside-500/20">
          <h4 className="text-xs font-black text-outside-500 uppercase tracking-widest mb-1">Comment gagner des points ?</h4>
          <p className="text-[10px] leading-relaxed text-[var(--os-muted)]">
            Participe à des plans, crée du contenu régulier, complète ton profil et sois fiable. Ton Quality Score reflète ton engagement dans la communauté OUTSIDE.
          </p>
        </div>
      </div>
    </AnimatedPage>
  );
}
