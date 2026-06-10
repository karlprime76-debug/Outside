"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, Sparkles } from "lucide-react";
import { OutsidePage } from "@/components/ui/outside-page";
import { OutsideHeader } from "@/components/ui/outside-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShareActions } from "@/components/referrals/share-actions";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  stats: { total: number; accepted: number; pending: number };
  invites: Array<{
    id: string;
    code: string;
    invitedEmail?: string | null;
    invitedPhone?: string | null;
    acceptedAt?: string | null;
    acceptedUser?: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    } | null;
    createdAt: string;
  }>;
}

const REWARD_TIERS = [
  { count: 1, label: "Premier invité", badge: "FIRST_INVITE" },
  { count: 3, label: "Cercle lancé", badge: "CIRCLE_LAUNCHER" },
  { count: 5, label: "5 amis ramenés", badge: "FIVE_INVITES" },
  { count: 10, label: "Ambassadeur local", badge: "LOCAL_AMBASSADOR" },
];

export default function InvitePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }

    fetch("/api/referrals/code")
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, router]);

  if (loading) {
    return (
      <OutsidePage className="flex flex-col h-[100dvh] pb-24">
        <OutsideHeader title="Invite ton cercle" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-outside-500 border-t-transparent rounded-full" />
        </div>
      </OutsidePage>
    );
  }

  if (!data) {
    return (
      <OutsidePage className="flex flex-col h-[100dvh] pb-24">
        <OutsideHeader title="Invite ton cercle" />
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-center text-[var(--os-muted)]">Erreur lors du chargement.</p>
        </div>
      </OutsidePage>
    );
  }

  return (
    <OutsidePage className="flex flex-col h-[100dvh] pb-24">
      <OutsideHeader title="Invite ton cercle" />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-outside-500 to-accent-500 mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[var(--os-fg)] mb-2">Invite ton cercle sur OUTSIDE</h1>
          <p className="text-sm text-[var(--os-muted)]">
            Plus ton cercle est dehors, plus OUTSIDE devient vivant.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-4 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)]">
            <div className="text-2xl font-black text-outside-500">{data.stats.accepted}</div>
            <div className="text-xs text-[var(--os-muted)]">Amis ramenés</div>
          </div>
          <div className="text-center p-4 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)]">
            <div className="text-2xl font-black text-green-500">{data.stats.accepted}</div>
            <div className="text-xs text-[var(--os-muted)]">Inscrits</div>
          </div>
          <div className="text-center p-4 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)]">
            <Badge variant="outline" className="text-base font-black">{data.referralCode}</Badge>
            <div className="text-xs text-[var(--os-muted)] mt-1">Ton code</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)]">
          <p className="text-sm font-bold text-[var(--os-fg)] mb-2">Ton lien personnel</p>
          <p className="text-xs text-[var(--os-muted)] break-all">{data.referralLink}</p>
        </div>

        <ShareActions referralLink={data.referralLink} />

        {data.invites.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--os-muted)] mb-3">Ton cercle</h2>
            <div className="space-y-3">
              {data.invites.map((invite) => (
                <div key={invite.id} className="p-4 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)]">
                  <div className="flex items-center gap-3">
                    {invite.acceptedUser ? (
                      <>
                        <Avatar src={invite.acceptedUser.image} name={invite.acceptedUser.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[var(--os-fg)] truncate">
                            {invite.acceptedUser.name || "Anonyme"}
                          </p>
                          <p className="text-xs text-[var(--os-muted)]">@{invite.acceptedUser.username}</p>
                        </div>
                        <Badge variant="green">Inscrit</Badge>
                      </>
                    ) : (
                      <p className="text-sm text-[var(--os-muted)]">Invitation en attente</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 rounded-xl border border-[var(--os-card-border)] bg-gradient-to-br from-outside-50/50 to-accent-50/50 dark:from-outside-950/10 dark:to-accent-950/10">
          <h3 className="text-sm font-bold text-[var(--os-fg)] mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-outside-500" />
            Récompenses fondateur
          </h3>
          <ul className="space-y-2">
            {REWARD_TIERS.map((tier) => (
              <li key={tier.badge} className="flex items-center justify-between text-xs">
                <span className="text-[var(--os-muted)]">{tier.label}</span>
                <span className={data.stats.accepted >= tier.count ? "font-bold text-green-600" : "text-[var(--os-muted)]"}>
                  {data.stats.accepted >= tier.count ? "✓ Débloqué" : `${tier.count} ami${tier.count > 1 ? "s" : ""}`}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-[var(--os-muted)] mt-3">Badges et reconnaissance uniquement — pas d&apos;argent.</p>
        </div>

        <Link href="/plans" className="block text-center text-sm font-bold text-outside-600 hover:text-outside-700">
          Voir tes plans pour inviter ton cercle →
        </Link>
      </div>
    </OutsidePage>
  );
}
