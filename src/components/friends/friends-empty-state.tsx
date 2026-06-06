import { EmptyState } from "@/components/empty-state";
import { Users } from "lucide-react";

export function FriendsEmptyState() {
  return (
    <EmptyState
      icon={Users}
      title="Ajoute tes premiers amis"
      description="Découvre des personnes actives dans ta ville et suis des comptes intéressants."
      cta={{
        label: "Découvrir des personnes",
        href: "/discover",
      }}
    />
  );
}
