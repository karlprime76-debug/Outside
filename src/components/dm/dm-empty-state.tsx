import { EmptyState } from "@/components/empty-state";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

export function DMEmptyState() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Ramène ton cercle sur OUTSIDE"
      description="Invite tes amis et commence à discuter pour organiser tes sorties."
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
            Inviter un ami
          </Link>
        </>
      }
    />
  );
}
