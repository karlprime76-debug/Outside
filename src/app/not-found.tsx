"use client";

import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-gradient-to-b from-outside-50/50 to-white dark:from-surface-dark dark:to-surface-dark">
      <div className="text-center space-y-6">
        <div className="relative mx-auto h-24 w-24">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-outside-500 to-accent-500 opacity-20 animate-pulse" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-outside-500 to-accent-500 shadow-glow">
            <Compass className="h-10 w-10 text-white" />
          </div>
        </div>

        <div>
          <h1 className="text-6xl font-black text-zinc-900 dark:text-zinc-100">404</h1>
          <p className="mt-2 text-lg text-zinc-500 dark:text-zinc-400">
            Cette page n&apos;existe pas
          </p>
        </div>

        <Link
          href="/home"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-8 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
