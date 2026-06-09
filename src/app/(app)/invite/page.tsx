"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Copy, Share2, MessageCircle, Users, CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { OutsidePage } from "@/components/ui/outside-page";
import { OutsideHeader } from "@/components/ui/outside-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  stats: {
    total: number;
    accepted: number;
    pending: number;
  };
  invites: Array<{
    id: string;
    code: string;
    invitedEmail?: string;
    invitedPhone?: string;
    acceptedAt?: string | null;
    acceptedUser?: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
    createdAt: string;
  }>;
}

export default function InvitePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  const shareNative = async () => {
    if (data?.referralLink && navigator.share) {
      try {
        await navigator.share({
          title: "Rejoins OUTSIDE",
          text: "Plus ton cercle est dehors, plus OUTSIDE devient vivant. 🌟",
          url: data.referralLink,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    }
  };

  if (loading) {
    return (
      <OutsidePage className="flex flex-col h-[100dvh]">
        <OutsideHeader title="Invite ton cercle" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-outside-500 border-t-transparent rounded-full" />
        </div>
      </OutsidePage>
    );
  }

  if (!data) {
    return (
      <OutsidePage className="flex flex-col h-[100dvh]">
        <OutsideHeader title="Invite ton cercle" />
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-center text-[var(--os-muted)]">Erreur lors du chargement.</p>
        </div>
      </OutsidePage>
    );
  }

  return (
    <OutsidePage className="flex flex-col h-[100dvh]">
      <OutsideHeader title="Invite ton cercle" />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-outside-500 to-accent-500 mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[var(--os-fg)] mb-2">Invite ton cercle sur OUTSIDE</h1>
          <p className="text-sm text-[var(--os-muted)]">
            Plus ton cercle est dehors, plus OUTSIDE devient vivant.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="text-center p-4 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)]">
            <div className="text-2xl font-black text-outside-500">{data.stats.total}</div>
            <div className="text-xs text-[var(--os-muted)]">Invités</div>
          </div>
          <div className="text-center p-4 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)]">
            <div className="text-2xl font-black text-green-500">{data.stats.accepted}</div>
            <div className="text-xs text-[var(--os-muted)]">Acceptés</div>
          </div>
          <div className="text-center p-4 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)]">
            <div className="text-2xl font-black text-amber-500">{data.stats.pending}</div>
            <div className="text-xs text-[var(--os-muted)]">En attente</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[var(--os-fg)]">Ton lien d&apos;invitation</span>
            <Badge variant="outline">{data.referralCode}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={data.referralLink}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-[var(--os-bg)] border border-[var(--os-card-border)] rounded-lg text-[var(--os-muted)]"
            />
            <button
              onClick={copyLink}
              className="px-4 py-2 rounded-lg bg-outside-500 text-white font-bold text-sm hover:bg-outside-600 transition-colors"
            >
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={shareWhatsApp}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
          >
            <MessageCircle className="h-5 w-5 text-green-600" />
            <span className="font-bold text-green-700">Partager sur WhatsApp</span>
          </button>

          <button
            onClick={shareNative}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-300 transition-colors"
          >
            <Share2 className="h-5 w-5 text-[var(--os-fg)]" />
            <span className="font-bold text-[var(--os-fg)]">Partager</span>
          </button>

          <Link
            href="/plans/new"
            className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-300 transition-colors"
          >
            <Sparkles className="h-5 w-5 text-accent-500" />
            <span className="font-bold text-[var(--os-fg)]">Inviter à un plan</span>
            <ArrowRight className="h-4 w-4 text-[var(--os-muted)]" />
          </Link>
        </div>

        {data.invites.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--os-muted)] mb-3">Tes invitations</h2>
            <div className="space-y-3">
              {data.invites.map((invite) => (
                <div key={invite.id} className="p-4 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {invite.acceptedUser ? (
                        <>
                          <Avatar src={invite.acceptedUser.image} name={invite.acceptedUser.name} size="sm" />
                          <div>
                            <p className="text-sm font-bold text-[var(--os-fg)]">{invite.acceptedUser.name || "Anonyme"}</p>
                            <p className="text-xs text-[var(--os-muted)]">@{invite.acceptedUser.username}</p>
                          </div>
                        </>
                      ) : (
                        <div>
                          <p className="text-sm font-bold text-[var(--os-fg)]">{invite.invitedEmail || invite.invitedPhone || "Invité"}</p>
                          <p className="text-xs text-[var(--os-muted)]">En attente</p>
                        </div>
                      )}
                    </div>
                    {invite.acceptedAt ? (
                      <Badge variant="green">Accepté</Badge>
                    ) : (
                      <Badge variant="amber">En attente</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 rounded-xl border border-[var(--os-card-border)] bg-gradient-to-br from-outside-50/50 to-accent-50/50">
          <h3 className="text-sm font-bold text-[var(--os-fg)] mb-2">Récompenses</h3>
          <ul className="space-y-2 text-xs text-[var(--os-muted)]">
            <li className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-outside-500" />
              Premier invité : Badge &quot;Premier invité&quot;
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-outside-500" />
              5 amis ramenés : Badge &quot;Cercle lancé&quot;
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-outside-500" />
              20 amis ramenés : Badge &quot;Ambassadeur local&quot;
            </li>
          </ul>
        </div>
      </div>
    </OutsidePage>
  );
}
