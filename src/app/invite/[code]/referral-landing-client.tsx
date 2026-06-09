"use client";

import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface ReferralLandingClientProps {
  inviter: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  code: string;
  isAuthenticated: boolean;
}

export default function ReferralLandingClient({
  inviter,
  code,
  isAuthenticated,
}: ReferralLandingClientProps) {
  const inviterName = inviter.name || inviter.username || "Un ami";
  const inviterImage = inviter.image;
  const registerHref = `/register?referral=${encodeURIComponent(code)}`;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/invite/${code}`)}`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--os-bg)]">
      <Card className="max-w-md w-full border border-[var(--os-card-border)]">
        <div className="text-center mb-6 p-6 pb-0">
          {inviterImage && (
            <div className="mx-auto mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inviterImage}
                alt={`Photo de profil de ${inviterName}`}
                className="w-20 h-20 rounded-full object-cover"
              />
            </div>
          )}
          <h2 className="text-2xl font-black text-[var(--os-fg)]">
            {inviterName} t&apos;invite sur OUTSIDE
          </h2>
          <p className="text-sm text-[var(--os-muted)] mt-2">
            Rejoins le cercle et découvre ce qui se passe autour de toi, maintenant.
          </p>
        </div>
        <div className="space-y-4 px-6 pb-6">
          <div className="bg-[var(--os-card)] border border-[var(--os-card-border)] p-4 rounded-xl text-center">
            <p className="text-sm text-[var(--os-muted)]">
              Plus ton cercle est dehors, plus OUTSIDE devient vivant.
            </p>
          </div>

          {isAuthenticated ? (
            <Link
              href="/home"
              className="flex items-center justify-center gap-2 w-full px-5 py-2.5 text-sm bg-gradient-to-r from-outside-500 to-accent-500 text-white hover:shadow-glow-lg rounded-xl font-bold transition-all"
            >
              Continuer vers OUTSIDE
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <div className="space-y-2">
              <Link
                href={registerHref}
                className="block w-full px-5 py-2.5 text-sm bg-gradient-to-r from-outside-500 to-accent-500 text-white hover:shadow-glow-lg rounded-xl font-bold transition-all text-center"
              >
                Créer un compte
              </Link>
              <Link
                href={loginHref}
                className="block w-full px-5 py-2.5 text-sm bg-[var(--os-card)] border border-[var(--os-card-border)] text-[var(--os-fg)] hover:bg-[var(--os-card-border)] rounded-xl font-bold transition-all text-center"
              >
                Se connecter
              </Link>
            </div>
          )}

          <p className="text-center text-xs text-[var(--os-muted)]">
            En rejoignant via ce lien, tu acceptes que {inviterName} soit ton parrain. Aucun message n&apos;est envoyé automatiquement.
          </p>
        </div>
      </Card>
    </div>
  );
}
