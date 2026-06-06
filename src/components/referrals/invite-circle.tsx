"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Copy, MessageCircle, Share2, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  stats: {
    total: number;
    accepted: number;
    pending: number;
  };
}

export function InviteCircle({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referrals/code")
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const copyLink = async () => {
    if (data?.referralLink) {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    if (data?.referralLink) {
      const text = encodeURIComponent("Rejoins OUTSIDE ! Plus ton cercle est dehors, plus OUTSIDE devient vivant. 🌟");
      const url = encodeURIComponent(data.referralLink);
      window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
    }
  };

  if (loading || !data) {
    return null;
  }

  if (compact) {
    return (
      <Link
        href="/invite"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 text-white font-bold text-sm shadow-glow hover:shadow-glow-lg transition-all"
      >
        <Users className="h-4 w-4" />
        Invite ton cercle
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-outside-500" />
          <h3 className="font-bold text-[var(--os-fg)]">Invite ton cercle</h3>
          <Badge variant="outline">{data.stats.accepted} acceptés</Badge>
        </div>
        <Sparkles className="h-4 w-4 text-accent-500" />
      </div>

      <p className="text-sm text-[var(--os-muted)] mb-4">
        Plus ton cercle est dehors, plus OUTSIDE devient vivant.
      </p>

      <div className="space-y-2">
        <button
          onClick={copyLink}
          className="w-full flex items-center justify-center gap-3 p-3 rounded-xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-300 transition-colors"
        >
          <Copy className="h-4 w-4 text-[var(--os-fg)]" />
          <span className="font-bold text-sm text-[var(--os-fg)]">
            {copied ? "Copié !" : "Copier le lien"}
          </span>
        </button>

        <button
          onClick={shareWhatsApp}
          className="w-full flex items-center justify-center gap-3 p-3 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
        >
          <MessageCircle className="h-4 w-4 text-green-600" />
          <span className="font-bold text-sm text-green-700">WhatsApp</span>
        </button>

        <Link
          href="/invite"
          className="w-full flex items-center justify-center gap-3 p-3 rounded-xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-300 transition-colors"
        >
          <Share2 className="h-4 w-4 text-[var(--os-fg)]" />
          <span className="font-bold text-sm text-[var(--os-fg)]">Voir tout</span>
          <ArrowRight className="h-4 w-4 text-[var(--os-muted)]" />
        </Link>
      </div>
    </div>
  );
}
