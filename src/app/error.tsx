"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-gradient-to-b from-red-50/50 to-white dark:from-red-950/10 dark:to-surface-dark">
      <div className="text-center space-y-6">
        <div className="relative mx-auto h-24 w-24">
          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-red-500 shadow-lg">
            <AlertTriangle className="h-10 w-10 text-white" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
            Oups, une erreur est survenue
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Quelque chose s&apos;est mal passé. Essaye de rafraîchir la page ou reviens plus tard.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-8 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-200 px-8 py-3 text-sm font-bold text-zinc-700 hover:border-outside-300 hover:bg-outside-50/50 transition-all dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-outside-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
