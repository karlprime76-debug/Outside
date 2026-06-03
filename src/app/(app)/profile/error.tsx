"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[ProfileError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h1 className="mb-2 text-xl font-black text-[var(--os-fg)]">
        Impossible de charger ton profil pour le moment.
      </h1>
      <p className="mb-6 max-w-xs text-sm text-[var(--os-muted)]">
        Un problème est survenu. Réessaie ou reviens plus tard.
      </p>
      <Button onClick={reset} variant="primary">
        Réessayer
      </Button>
    </div>
  );
}
