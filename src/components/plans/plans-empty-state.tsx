import { EmptyState } from "@/components/empty-state";
import { Calendar } from "lucide-react";

export function PlansEmptyState() {
  return (
    <EmptyState
      icon={Calendar}
      title="Aucun plan actif ici pour le moment"
      description="Crée un plan ou rejoins-en un pour sortir avec du monde."
      cta={{
        label: "Créer un plan express",
        href: "/plans/new",
      }}
    />
  );
}
