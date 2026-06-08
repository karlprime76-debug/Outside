"use client";

import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="max-w-md w-full">
        <div className="text-center mb-6">
          {inviterImage && (
            <div className="mx-auto mb-4">
              <img
                src={inviterImage}
                alt={inviterName}
                className="w-20 h-20 rounded-full object-cover"
              />
            </div>
          )}
          <h2 className="text-2xl font-semibold">
            {inviterName} t&apos;invite sur OUTSIDE
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Rejoins le cercle et découvre ce qui se passe autour de toi, maintenant.
          </p>
        </div>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Plus ton cercle est dehors, plus OUTSIDE devient vivant.
            </p>
          </div>

          {isAuthenticated ? (
            <a
              href="/home"
              className="flex items-center justify-center gap-2 w-full px-5 py-2.5 text-sm bg-outside-600 text-white hover:bg-outside-700 rounded-xl font-semibold transition-all"
            >
              Continuer vers OUTSIDE
              <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <div className="space-y-2">
              <a
                href={`/auth/login?callbackUrl=/api/referrals/${code}`}
                className="block w-full px-5 py-2.5 text-sm bg-outside-600 text-white hover:bg-outside-700 rounded-xl font-semibold transition-all text-center"
              >
                Se connecter
              </a>
              <a
                href={`/auth/signup?callbackUrl=/api/referrals/${code}`}
                className="block w-full px-5 py-2.5 text-sm bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-xl font-semibold transition-all text-center"
              >
                Créer un compte
              </a>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>En rejoignant OUTSIDE via ce lien, tu acceptes que {inviterName} soit ton parrain.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
