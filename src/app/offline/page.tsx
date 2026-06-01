"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-gradient-to-b from-zinc-50 to-white dark:from-surface-dark dark:to-surface-dark">
      <div className="text-center space-y-6">
        <div className="relative mx-auto h-24 w-24">
          <div className="absolute inset-0 rounded-full bg-zinc-500/20 animate-pulse" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800 shadow-lg dark:bg-zinc-700">
            <WifiOff className="h-10 w-10 text-zinc-400" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
            Hors ligne
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Tu sembles être déconnecté. Vérifie ta connexion et réessaie.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-8 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-200 px-8 py-3 text-sm font-bold text-zinc-700 hover:border-outside-300 hover:bg-outside-50/50 transition-all dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-outside-700"
          >
            <Home className="h-4 w-4" />
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
