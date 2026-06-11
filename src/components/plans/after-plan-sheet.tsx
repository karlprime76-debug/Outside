"use client";

import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Camera, Star, Calendar, CheckCircle } from "lucide-react";

interface AfterPlanSheetProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planTitle: string;
  participants: Array<{ id: string; name: string | null; image: string | null }>;
}

export function AfterPlanSheet({ isOpen, onClose, planId, planTitle, participants }: AfterPlanSheetProps) {
  const router = useRouter();

  const handlePublishMoment = () => {
    router.push(`/moments/new?planId=${planId}`);
    onClose();
  };

  const handleValidateParticipants = () => {
    router.push(`/plans/${planId}?tab=reviews`);
    onClose();
  };

  const handleRateAmbiance = () => {
    router.push(`/plans/${planId}`);
    onClose();
  };

  const handleCreateNewPlan = () => {
    router.push(`/plans/new?fromPlan=${planId}`);
    onClose();
  };

  return (
    <BottomSheet 
      open={isOpen} 
      onClose={onClose} 
      title="Bilan du plan"
      footer={(
        <Button onClick={onClose} className="w-full">
          Terminer
        </Button>
      )}
    >
      <div className="space-y-4 p-2">
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--os-fg)]">{planTitle}</p>
          <p className="text-xs text-[var(--os-muted)]">Partage ton experience</p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handlePublishMoment}
            className="w-full justify-start gap-3"
            variant="ghost"
          >
            <Camera className="h-5 w-5" />
            <div className="text-left">
              <p className="font-semibold">Publier un Moment</p>
              <p className="text-xs text-[var(--os-muted)]">Partage des photos du plan</p>
            </div>
          </Button>

          <Button
            onClick={handleValidateParticipants}
            className="w-full justify-start gap-3"
            variant="ghost"
          >
            <CheckCircle className="h-5 w-5" />
            <div className="text-left">
              <p className="font-semibold">Valider les participants</p>
              <p className="text-xs text-[var(--os-muted)]">Confirme la presence</p>
            </div>
          </Button>

          <Button
            onClick={handleRateAmbiance}
            className="w-full justify-start gap-3"
            variant="ghost"
          >
            <Star className="h-5 w-5" />
            <div className="text-left">
              <p className="font-semibold">Noter l&apos;ambiance</p>
              <p className="text-xs text-[var(--os-muted)]">Donne ton avis sur le lieu</p>
            </div>
          </Button>

          <Button
            onClick={handleCreateNewPlan}
            className="w-full justify-start gap-3"
            variant="ghost"
          >
            <Calendar className="h-5 w-5" />
            <div className="text-left">
              <p className="font-semibold">Replanifier avec ces gens</p>
              <p className="text-xs text-[var(--os-muted)]">Creer un nouveau plan similaire</p>
            </div>
          </Button>
        </div>

        {participants.length > 0 && (
          <div className="pt-4 border-t border-[var(--os-card-border)]">
            <p className="text-xs font-semibold text-[var(--os-muted)] mb-2">Participants</p>
            <div className="flex -space-x-2">
              {participants.slice(0, 5).map((p) => (
                <Avatar key={p.id} src={p.image} name={p.name} size="sm" className="border-2 border-[var(--os-card)]" />
              ))}
              {participants.length > 5 && (
                <div className="h-8 w-8 rounded-full bg-[var(--os-card-border)] border-2 border-[var(--os-card)] flex items-center justify-center text-xs font-bold text-[var(--os-fg)]">
                  +{participants.length - 5}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
