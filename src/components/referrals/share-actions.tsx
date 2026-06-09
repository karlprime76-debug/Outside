"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, MessageCircle, Share2, CheckCircle, Calendar } from "lucide-react";
import { REFERRAL_SHARE_TEXT, buildWhatsAppShareUrl } from "@/lib/referral-share";

interface ShareActionsProps {
  referralLink: string;
  showPlanInvite?: boolean;
}

export function ShareActions({ referralLink, showPlanInvite = true }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    window.open(buildWhatsAppShareUrl(referralLink), "_blank", "noopener,noreferrer");
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Rejoins OUTSIDE",
          text: REFERRAL_SHARE_TEXT,
          url: referralLink,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      await copyLink();
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={copyLink}
        className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-300 transition-colors"
      >
        {copied ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-[var(--os-fg)]" />}
        <span className="font-bold text-[var(--os-fg)]">{copied ? "Lien copié !" : "Copier mon lien"}</span>
      </button>

      <button
        type="button"
        onClick={shareWhatsApp}
        className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors dark:border-green-800 dark:bg-green-950/20"
      >
        <MessageCircle className="h-5 w-5 text-green-600" />
        <span className="font-bold text-green-700">Partager sur WhatsApp</span>
      </button>

      <button
        type="button"
        onClick={shareNative}
        className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-300 transition-colors"
      >
        <Share2 className="h-5 w-5 text-[var(--os-fg)]" />
        <span className="font-bold text-[var(--os-fg)]">Partager par message</span>
      </button>

      {showPlanInvite && (
        <Link
          href="/plans/new"
          className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] hover:border-outside-300 transition-colors"
        >
          <Calendar className="h-5 w-5 text-accent-500" />
          <span className="font-bold text-[var(--os-fg)]">Inviter à un plan</span>
        </Link>
      )}
    </div>
  );
}
