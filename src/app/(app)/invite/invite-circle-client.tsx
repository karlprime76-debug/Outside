"use client";

import { useState } from "react";
import { Copy, Share2, MessageCircle, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface InviteCircleClientProps {
  referralCode: string;
  invitesSent: number;
  invitesAccepted: number;
}

export default function InviteCircleClient({
  referralCode,
  invitesSent,
  invitesAccepted,
}: InviteCircleClientProps) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}/invite/${referralCode}`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = "Rejoins-moi sur OUTSIDE ! Plus ton cercle est dehors, plus OUTSIDE devient vivant.";
    const url = `https://wa.me/?text=${encodeURIComponent(text + " " + inviteUrl)}`;
    window.open(url, "_blank");
  };

  const shareByMessage = () => {
    if (navigator.share) {
      navigator.share({
        title: "Invite ton cercle sur OUTSIDE",
        text: "Plus ton cercle est dehors, plus OUTSIDE devient vivant.",
        url: inviteUrl,
      });
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black mb-2 text-[var(--os-fg)]">Invite ton cercle sur OUTSIDE</h1>
        <p className="text-[var(--os-muted)]">
          Plus ton cercle est dehors, plus OUTSIDE devient vivant.
        </p>
      </div>

      <Card className="mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-[var(--os-fg)]">
            <Users className="h-5 w-5 text-outside-500" />
            Ton lien d&apos;invitation
          </h2>
          <p className="text-sm text-[var(--os-muted)] mt-1">
            Partage ce lien avec tes amis pour les inviter sur OUTSIDE.
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-[var(--os-card-border)] rounded-xl bg-[var(--os-card)] text-[var(--os-fg)]"
            />
            <Button onClick={copyToClipboard} variant="primary">
              {copied ? "Copié !" : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={shareOnWhatsApp} variant="secondary" className="w-full">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button onClick={shareByMessage} variant="secondary" className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-[var(--os-fg)]">
            <Award className="h-5 w-5 text-outside-500" />
            Tes statistiques
          </h2>
        </div>
        <div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-[var(--os-card)] border border-[var(--os-card-border)] rounded-xl">
              <div className="text-2xl font-bold text-[var(--os-fg)]">{invitesSent}</div>
              <div className="text-sm text-[var(--os-muted)]">Invitations envoyées</div>
            </div>
            <div className="text-center p-4 bg-[var(--os-card)] border border-[var(--os-card-border)] rounded-xl">
              <div className="text-2xl font-bold text-[var(--os-fg)]">{invitesAccepted}</div>
              <div className="text-sm text-[var(--os-muted)]">Amis inscrits</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-6 text-center">
        <Link href="/plans" className="text-outside-500 hover:text-outside-600 font-semibold">
          Inviter à un plan
        </Link>
      </div>
    </div>
  );
}
