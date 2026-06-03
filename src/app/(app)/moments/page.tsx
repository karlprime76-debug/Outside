"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { MomentFeed } from "@/components/moments/moment-feed";
import { OutsidePage } from "@/components/ui/outside-page";
import { OutsideHeader } from "@/components/ui/outside-header";

export default function MomentsPage() {
  return (
    <OutsidePage className="flex flex-col h-[100dvh] sm:h-auto sm:min-h-[100dvh]">
      <OutsideHeader
        title="Moments"
        subtitle="Ce qui se passe dehors, maintenant."
        right={(
          <Link
            href="/moments/new"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-outside-500 to-accent-500 text-white shadow-glow hover:shadow-glow-lg transition-all"
            aria-label="Ajouter un moment"
          >
            <Plus className="h-5 w-5" />
          </Link>
        )}
      />
      <div className="flex-1 overflow-hidden">
        <MomentFeed />
      </div>
    </OutsidePage>
  );
}
