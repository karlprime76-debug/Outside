"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TrustSignals as TrustSignalsType } from "@/lib/trust";

interface TrustSignalsProps {
  signals: TrustSignalsType;
  compact?: boolean;
}

function SignalRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full",
          active ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400"
        )}
      >
        {active ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
      </div>
      <span className={cn("text-xs", active ? "text-[var(--os-fg)]" : "text-[var(--os-muted)]")}>
        {label}
      </span>
    </div>
  );
}

export function TrustSignals({ signals, compact }: TrustSignalsProps) {
  const items = [
    { label: "Photo de profil", active: signals.hasPhoto },
    { label: "Compte actif", active: signals.accountAgeDays > 7 },
    { label: "Plans confirmés", active: signals.plansConfirmed > 0 },
    { label: "Email vérifié", active: signals.emailVerified },
  ];

  if (compact) {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {items.map((item) => (
          <SignalRow key={item.label} label={item.label} active={item.active} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <SignalRow key={item.label} label={item.label} active={item.active} />
      ))}
    </div>
  );
}
