import { EmptyState } from "@/components/empty-state";
import { Globe } from "lucide-react";
import Link from "next/link";

export function PassportEmptyState() {
  return (
    <EmptyState
      icon={Globe}
      title="Ton Passeport se remplit quand tu sors"
      description="Rejoins des plans, publie des moments et découvre de nouvelles villes."
      actions={
        <>
          <Link
            href="/missions"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-7 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
          >
            Voir les missions
          </Link>
          <Link
            href="/plans"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--os-card-border)] bg-[var(--os-card)] px-7 py-3 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-all pressable"
          >
            Découvrir des plans
          </Link>
        </>
      }
    />
  );
}
