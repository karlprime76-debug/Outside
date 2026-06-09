import { EmptyState } from "@/components/empty-state";
import { Calendar } from "lucide-react";
import Link from "next/link";

export function PlansEmptyState() {
  return (
    <EmptyState
      icon={Calendar}
      title="Aucun plan actif ici pour le moment"
      description="Crée un plan ou rejoins-en un pour sortir avec du monde."
      actions={
        <>
          <Link
            href="/plans/new"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-7 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
          >
            Créer un plan
          </Link>
          <Link
            href="/plans?budget=FREE"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--os-card-border)] bg-[var(--os-card)] px-7 py-3 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-all pressable"
          >
            Plans gratuits
          </Link>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--os-card-border)] bg-[var(--os-card)] px-7 py-3 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-all pressable"
          >
            Changer de ville
          </Link>
        </>
      }
    />
  );
}
