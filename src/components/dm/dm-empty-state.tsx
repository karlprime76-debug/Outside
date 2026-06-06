import { EmptyState } from "@/components/empty-state";
import { MessageSquare } from "lucide-react";

export function DMEmptyState() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Ramène ton cercle sur OUTSIDE"
      description="Invite tes amis et commence à discuter pour organiser tes sorties."
      cta={{
        label: "Inviter un ami",
        href: "/invite",
      }}
    />
  );
}
