"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Heart, 
  Share2, 
  Copy, 
  Check, 
  ArrowLeft,
  LayoutDashboard,
  Zap
} from "lucide-react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { SectionTitle } from "@/components/ui/section-title";

interface ProStats {
  plansCount: number;
  momentsCount: number;
  referralsCount: number;
  totalParticipants: number;
  totalSaves: number;
  engagementRate: number | string;
}

export default function ProDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ProStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    fetch("/api/pro/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.referralCode) setReferralCode(data.user.referralCode);
      });
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
        <div className="h-40 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl" />
          <div className="h-32 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-4xl mx-auto space-y-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <div className="flex items-center gap-2 px-3 py-1 bg-outside-500/10 border border-outside-500/20 rounded-full">
          <Zap className="h-3.5 w-3.5 text-outside-500 fill-outside-500" />
          <span className="text-[10px] font-black uppercase tracking-wider text-outside-600">Partenaire</span>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-[var(--os-fg)] flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-outside-500" />
          Dashboard PRO
        </h1>
        <p className="text-[var(--os-muted)]">Suivez la performance de votre activité sur OUTSIDE.</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="os-card p-6 bg-gradient-to-br from-outside-500 to-accent-600 text-white shadow-glow">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-6 w-6 text-white/80" />
            <TrendingUp className="h-4 w-4 text-white/60" />
          </div>
          <div className="text-4xl font-black">{stats?.totalParticipants || 0}</div>
          <div className="text-sm font-medium text-white/80 mt-1">Participants totaux</div>
        </div>

        <div className="os-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Heart className="h-6 w-6 text-pink-500" />
            <span className="text-[10px] font-bold text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-full">Saves</span>
          </div>
          <div className="text-4xl font-black text-[var(--os-fg)]">{stats?.totalSaves || 0}</div>
          <div className="text-sm font-medium text-[var(--os-muted)] mt-1">Plans sauvegardés</div>
        </div>

        <div className="os-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Zap className="h-6 w-6 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">Engagement</span>
          </div>
          <div className="text-4xl font-black text-[var(--os-fg)]">{stats?.engagementRate || 0}%</div>
          <div className="text-sm font-medium text-[var(--os-muted)] mt-1">Taux d&apos;engagement</div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Calendar, label: "Plans", value: stats?.plansCount || 0 },
          { icon: Share2, label: "Moments", value: stats?.momentsCount || 0 },
          { icon: Users, label: "Filleuls", value: stats?.referralsCount || 0 },
          { icon: Zap, label: "Score", value: 92 }, // Mock score for now
        ].map((s, i) => (
          <div key={i} className="os-card p-4 flex flex-col items-center text-center">
            <s.icon className="h-5 w-5 text-[var(--os-muted)] mb-2" />
            <div className="text-xl font-bold text-[var(--os-fg)]">{s.value}</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--os-muted)] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Referral Section */}
      <section className="space-y-4">
        <SectionTitle title="Parrainage & Growth" subtitle="Invitez votre communauté et gagnez en visibilité." />
        <div className="os-card p-6 border-dashed border-2 border-outside-500/30 bg-outside-500/5">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 space-y-2">
              <h3 className="font-bold text-[var(--os-fg)]">Votre code de parrainage</h3>
              <p className="text-sm text-[var(--os-muted)]">
                Chaque nouvel utilisateur inscrit avec ce code booste votre classement dans l&apos;algorithme de la ville.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex-1 md:w-48 h-12 bg-[var(--os-bg)] border border-[var(--os-card-border)] rounded-xl flex items-center justify-center font-mono font-bold text-lg text-outside-600 tracking-widest">
                {referralCode || "------"}
              </div>
              <button
                onClick={copyCode}
                className="h-12 w-12 flex items-center justify-center bg-outside-500 text-white rounded-xl hover:bg-outside-600 transition-colors shadow-glow active:scale-95"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity Mock */}
      <section className="space-y-4">
        <SectionTitle title="Dernières performances" />
        <div className="os-card divide-y divide-[var(--os-card-border)]">
          {[1, 2, 3].map((item) => (
            <div key={item} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                <div>
                  <div className="text-sm font-bold text-[var(--os-fg)]">Afterwork Neon #{item}</div>
                  <div className="text-xs text-[var(--os-muted)]">Il y a {item * 2} jours</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-500">+{item * 12} participations</div>
                <div className="text-[10px] text-[var(--os-muted)] uppercase font-black">Performance stable</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AnimatedPage>
  );
}
