"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ShareActions } from "@/components/referrals/share-actions";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  stats: { accepted: number };
}

export function InviteCircle({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referrals/code")
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

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
          <Badge variant="outline">{data.stats.accepted} inscrits</Badge>
        </div>
        <Sparkles className="h-4 w-4 text-accent-500" />
      </div>

      <p className="text-sm text-[var(--os-muted)] mb-4">
        Plus ton cercle est dehors, plus OUTSIDE devient vivant.
      </p>

      <ShareActions referralLink={data.referralLink} showPlanInvite={false} />

      <Link href="/invite" className="mt-3 block text-center text-xs font-bold text-outside-600 hover:text-outside-700">
        Voir les récompenses →
      </Link>
    </div>
  );
}
