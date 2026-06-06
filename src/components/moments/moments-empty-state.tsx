import { EmptyState } from "@/components/empty-state";
import { Camera } from "lucide-react";

export function MomentsEmptyState() {
  return (
    <EmptyState
      icon={Camera}
      title="Lance le premier Moment dans ta ville"
      description="Partage une sortie avec la communauté et découvre ce qui se passe autour de toi."
      cta={{
        label: "Publier un Moment",
        href: "/moments/new",
      }}
    />
  );
}
