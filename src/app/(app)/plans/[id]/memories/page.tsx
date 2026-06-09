"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, MessageSquare, Wallet, MapPin, Star, Trophy, Camera, CheckCircle2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface MemoriesData {
  plan: {
    id: string;
    title: string;
    startDate: string;
    status: string;
    city: { name: string };
    place: { name: string } | null;
    creator: { id: string; name: string | null; image: string | null };
  };
  participants: { id: string; name: string | null; image: string | null; attendance: string; checkedInAt: string | null }[];
  checkedInCount: number;
  participantCount: number;
  messageCount: number;
  recentMessages: { id: string; content: string; createdAt: string; author: { id: string; name: string | null; image: string | null } }[];
  polls: { id: string; question: string; isClosed: boolean; options: { id: string; label: string; voteCount: number }[]; totalVotes: number }[];
  expenses: { total: number; currency: string; count: number };
  highlight: { userId: string; name: string | null; image: string | null; score: number; count: number } | null;
}

export default function MemoriesPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<MemoriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/plans/${id}/memories`)
      .then((r) => {
        if (!r.ok) throw new Error("Impossible de charger les souvenirs");
        return r.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-3xl mx-auto text-center pt-16">
        <p className="text-zinc-500 dark:text-zinc-400 mb-4">{error}</p>
        <Link href={`/plans/${id}`} className="text-sm font-bold text-outside-600 hover:text-outside-700 transition-colors">
          Retour au plan
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const { plan, participants, checkedInCount, participantCount, messageCount, recentMessages, polls, expenses, highlight } = data;
  const date = new Date(plan.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6 pb-16">
      <Link
        href={`/plans/${id}`}
        className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au plan
      </Link>

      {/* Hero header */}
      <div className="rounded-2xl bg-gradient-to-br from-outside-600 to-accent-600 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-5 w-5 text-amber-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-200">Souvenirs</span>
        </div>
        <h1 className="text-2xl font-black mb-1">{plan.title}</h1>
        <p className="text-sm text-white/80">{date}</p>
        <div className="flex items-center gap-2 mt-2">
          <MapPin className="h-3.5 w-3.5 text-white/60" />
          <span className="text-sm text-white/80">{plan.city.name}</span>
          {plan.place && (
            <>
              <span className="text-white/40">·</span>
              <span className="text-sm text-white/80">{plan.place.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Users} label="Participants" value={participantCount.toString()} color="text-blue-500" />
        <StatCard icon={MessageSquare} label="Messages" value={messageCount.toString()} color="text-emerald-500" />
        <StatCard icon={Wallet} label={expenses.currency} value={`${expenses.total.toFixed(0)}`} color="text-amber-500" />
      </div>

      {/* Who came */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-surface-border dark:bg-surface-card">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="h-4 w-4 text-outside-500" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Qui est venu</h3>
          {checkedInCount > 0 && (
            <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full dark:bg-emerald-950/30 dark:text-emerald-400">
              {checkedInCount} check-in{checkedInCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <Avatar src={p.image} name={p.name} size="sm" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{p.name || "Anonyme"}</span>
              {p.checkedInAt && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
            </div>
          ))}
        </div>
      </div>

      {/* Highlight */}
      {highlight && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-surface-border dark:bg-surface-card">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Meilleur participant</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar src={highlight.image} name={highlight.name} size="lg" />
              <div className="absolute -top-1 -right-1 rounded-full bg-amber-400 p-0.5">
                <Trophy className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">{highlight.name || "Anonyme"}</p>
              <p className="text-xs text-zinc-500">{highlight.count} avis · {Math.round((highlight.score / highlight.count) * 100)}% positifs</p>
            </div>
          </div>
        </div>
      )}

      {/* Polls */}
      {polls.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-surface-border dark:bg-surface-card">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">Sondages</h3>
          <div className="space-y-4">
            {polls.map((poll) => {
              const maxVotes = Math.max(...poll.options.map((o) => o.voteCount), 1);
              return (
                <div key={poll.id}>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{poll.question}</p>
                  <div className="space-y-1.5">
                    {poll.options.map((option) => {
                      const pct = poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;
                      const isWinner = option.voteCount === maxVotes && poll.totalVotes > 0;
                      return (
                        <div key={option.id} className="relative rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
                          <div
                            className="absolute inset-0 rounded-lg bg-outside-500/10 dark:bg-outside-500/15 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                          <div className="relative z-10 flex items-center justify-between">
                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              {option.label}
                              {isWinner && <Trophy className="h-3 w-3 text-amber-500" />}
                            </span>
                            <span className="text-xs font-bold text-zinc-500">{option.voteCount} · {pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent messages */}
      {recentMessages.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white dark:border-surface-border dark:bg-surface-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <MessageSquare className="h-4 w-4 text-outside-500" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Derniers messages</h3>
            <span className="ml-auto text-xs text-zinc-400">{messageCount} message{messageCount > 1 ? "s" : ""}</span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 p-4">
                <Avatar src={msg.author.image} name={msg.author.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{msg.author.name || "Anonyme"}</span>
                    <span className="text-[10px] text-zinc-400">{new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-4">
        <p className="text-xs text-zinc-400">Plan créé par {plan.creator.name || "Anonyme"}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center dark:border-surface-border dark:bg-surface-card">
      <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
      <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}
