"use client";

import { X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { UploadProgress } from "@/lib/upload/retry-upload";

interface UploadProgressProps {
  progress: UploadProgress;
  onCancel?: () => void;
  compact?: boolean;
}

const statusLabels: Record<UploadProgress["status"], string> = {
  preparing: "Préparation",
  compressing: "Compression",
  uploading: "Envoi",
  processing: "Traitement",
  completed: "Terminé",
  error: "Erreur",
};

const statusIcons: Record<UploadProgress["status"], React.ReactNode> = {
  preparing: <Loader2 className="h-4 w-4 animate-spin" />,
  compressing: <Loader2 className="h-4 w-4 animate-spin" />,
  uploading: <Loader2 className="h-4 w-4 animate-spin" />,
  processing: <Loader2 className="h-4 w-4 animate-spin" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  error: <AlertCircle className="h-4 w-4 text-red-500" />,
};

export function UploadProgressComponent({ progress, onCancel, compact = false }: UploadProgressProps) {
  const { status, percentage, message } = progress;
  const isError = status === "error";
  const isCompleted = status === "completed";
  const isLoading = status === "preparing" || status === "compressing" || status === "uploading" || status === "processing";

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        {statusIcons[status]}
        <span className="text-[var(--os-muted)]">{statusLabels[status]}</span>
        {!isCompleted && !isError && <span className="text-[var(--os-muted)]">{percentage}%</span>}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[var(--os-card)] border border-[var(--os-card-border)] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcons[status]}
          <span className={`text-xs font-semibold ${isError ? "text-red-500" : isCompleted ? "text-green-500" : "text-[var(--os-fg)]"}`}>
            {statusLabels[status]}
          </span>
        </div>
        {onCancel && isLoading && (
          <button
            onClick={onCancel}
            className="text-[var(--os-muted)] hover:text-red-500 transition-colors"
            aria-label="Annuler"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!isCompleted && !isError && (
        <div className="space-y-1">
          <div className="h-1.5 bg-[var(--os-card-border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-outside-500 to-accent-500 transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[var(--os-muted)]">
            <span>{percentage}%</span>
            {message && <span>{message}</span>}
          </div>
        </div>
      )}

      {isError && message && (
        <p className="text-xs text-red-500">{message}</p>
      )}
    </div>
  );
}
