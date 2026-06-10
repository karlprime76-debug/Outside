"use client";

import { useState } from "react";
import { Copy, MessageCircle, Share2, CheckCircle, Send } from "lucide-react";
import { buildPlanShareText, buildWhatsAppShareUrl } from "@/lib/referral-share";

interface PlanInviteShareProps {
  planId: string;
  planTitle: string;
  onInviteByDm?: () => void;
  className?: string;
}

export function PlanInviteShare({ planId, planTitle, onInviteByDm, className }: PlanInviteShareProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const resolveShareUrl = async () => {
    if (shareUrl) return shareUrl;
    const res = await fetch(`/api/plans/${planId}/share-link`);
    if (!res.ok) throw new Error("share failed");
    const data = await res.json();
    setShareUrl(data.shareUrl);
    return data.shareUrl as string;
  };

  const copyLink = async () => {
    const url = await resolveShareUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = async () => {
    const url = await resolveShareUrl();
    window.open(buildWhatsAppShareUrl(url, buildPlanShareText(planTitle, url)), "_blank", "noopener,noreferrer");
  };

  const shareNative = async () => {
    const url = await resolveShareUrl();
    if (navigator.share) {
      await navigator.share({
        title: planTitle,
        text: buildPlanShareText(planTitle, url),
        url,
      });
    } else {
      await copyLink();
    }
  };

  return (
    <div className={`grid grid-cols-2 gap-2 ${className ?? ""}`}>
      <button
        type="button"
        onClick={copyLink}
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-3 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-colors"
      >
        {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copié" : "Copier le lien"}
      </button>

      <button
        type="button"
        onClick={shareWhatsApp}
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-green-200 bg-green-50 px-3 py-3 text-sm font-bold text-green-700 hover:bg-green-100 transition-colors dark:border-green-800 dark:bg-green-950/20"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </button>

      <button
        type="button"
        onClick={shareNative}
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-3 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-colors"
      >
        <Share2 className="h-4 w-4" />
        Partager
      </button>

      {onInviteByDm && (
        <button
          type="button"
          onClick={onInviteByDm}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-outside-200 bg-outside-50 px-3 py-3 text-sm font-bold text-outside-700 hover:bg-outside-100 transition-colors dark:border-outside-800 dark:bg-outside-950/20"
        >
          <Send className="h-4 w-4" />
          Envoyer en DM
        </button>
      )}
    </div>
  );
}
