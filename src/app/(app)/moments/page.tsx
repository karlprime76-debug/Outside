"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { MomentFeed } from "@/components/moments/moment-feed";

export default function MomentsPage() {
  return (
    <div className="flex flex-col h-[100dvh] sm:h-auto sm:min-h-[100dvh] bg-[var(--os-bg)]">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--os-card-border)] bg-[var(--os-bg)]/90 backdrop-blur-md px-4 py-3">
        <h1 className="text-lg font-black text-[var(--os-fg)]">Moments</h1>
        <Link
          href="/moments/new"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-outside-500 to-accent-500 text-white shadow-glow hover:shadow-glow-lg transition-all"
          aria-label="Ajouter un moment"
        >
          <Plus className="h-5 w-5" />
        </Link>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-hidden">
        <MomentFeed />
      </div>
    </div>
  );
}
