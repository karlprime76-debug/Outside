import { EmptyState } from "@/components/empty-state";
import { Camera } from "lucide-react";
import Link from "next/link";

export function MomentsEmptyState() {
  return (
    <EmptyState
      icon={Camera}
      title="Lance le premier Moment dans ta ville"
      description="Partage une sortie avec la communauté et découvre ce qui se passe autour de toi."
      actions={
        <>
          <Link
            href="/moments/new"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-7 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable"
          >
            Publier un Moment
          </Link>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--os-card-border)] bg-[var(--os-card)] px-7 py-3 text-sm font-bold text-[var(--os-fg)] hover:border-outside-300 transition-all pressable"
          >
            Découvrir
          </Link>
        </>
      }
    />
  );
}
