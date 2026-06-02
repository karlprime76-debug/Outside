"use client";

import { useState } from "react";
import { TrustReviewModal } from "./trust-review-modal";
import { UserCheck } from "lucide-react";

interface Props {
  reviewedId: string;
  reviewedName?: string;
  planId?: string | null;
}

export function TrustReviewButton({ reviewedId, reviewedName, planId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-outside-200 bg-outside-50 px-4 py-3 text-sm font-bold text-outside-700 hover:border-outside-300 hover:bg-outside-100 transition-all pressable w-full"
      >
        <UserCheck className="h-4 w-4" />
        Valider la confiance
      </button>
      {open && (
        <TrustReviewModal
          reviewedId={reviewedId}
          reviewedName={reviewedName}
          planId={planId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
