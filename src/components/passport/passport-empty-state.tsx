import { EmptyState } from "@/components/empty-state";
import { Globe } from "lucide-react";

export function PassportEmptyState() {
  return (
    <EmptyState
      icon={Globe}
      title="Ton Passeport se remplit quand tu sors"
      description="Rejoins des plans, publie des moments et découvre de nouvelles villes."
      cta={{
        label: "Voir les missions",
        href: "/missions",
      }}
    />
  );
}
