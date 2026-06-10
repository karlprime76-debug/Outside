"use client";

import { useDictionary } from "@/hooks/use-dictionary";
import { EmptyState } from "@/components/empty-state";
import { Users } from "lucide-react";
import Link from "next/link";

export function FriendsEmptyState() {
  const t = useDictionary();
  return (
    <EmptyState
      icon={Users}
      title={t.friend.addFirst}
      description={t.friend.discover}
      actions={
        <>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-7 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
          >
            Découvrir des personnes
          </Link>
          <Link
            href="/invite"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--os-card-border)] bg-[var(--os-card)] px-7 py-3 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-all pressable"
          >
            Invite ton cercle
          </Link>
        </>
      }
    />
  );
}
