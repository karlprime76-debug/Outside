"use client";

import { Trash2, Flag } from "lucide-react";

export interface DmMessage {
  id: string;
  senderId: string;
  content: string | null;
  isDeleted: boolean;
  createdAt: string;
  status?: string | null;
}

interface DmMessageBubbleProps {
  message: DmMessage;
  isMine: boolean;
  showAvatar?: boolean;
  otherImage?: string | null;
  otherName?: string | null;
  onDelete?: (id: string) => void;
  onReport?: (id: string) => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function DmMessageBubble({
  message,
  isMine,
  showAvatar,
  otherImage,
  otherName,
  onDelete,
  onReport,
}: DmMessageBubbleProps) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
      <div className="flex items-end gap-1.5 max-w-[80%]">
        {/* Avatar for received messages */}
        {!isMine && showAvatar && (
          <div className="shrink-0 pb-1">
            <img
              src={otherImage || undefined}
              alt={otherName || ""}
              className="h-6 w-6 rounded-full object-cover bg-[var(--os-card)]"
              loading="lazy"
            />
          </div>
        )}
        {!isMine && !showAvatar && <div className="w-7 shrink-0" />}

        <div
          className={`relative group rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isMine
              ? "bg-gradient-to-br from-outside-500 to-accent-500 text-white rounded-br-md"
              : "bg-[var(--os-card)] border border-[var(--os-card-border)] text-[var(--os-fg)] rounded-bl-md"
          }`}
        >
          {message.isDeleted ? (
            <span className="italic opacity-70">Message supprimé</span>
          ) : (
            <span className="whitespace-pre-wrap break-words">{message.content || ""}</span>
          )}

          {/* Time + actions */}
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className={`text-[10px] ${isMine ? "text-white/70" : "text-[var(--os-muted)]"}`}>
              {formatTime(message.createdAt)}
            </span>
            {!message.isDeleted && (
              <div className="hidden group-hover:flex items-center gap-1.5">
                {isMine && onDelete && (
                  <button
                    onClick={() => onDelete(message.id)}
                    className={`text-[10px] inline-flex items-center gap-0.5 ${isMine ? "text-white/80 hover:text-white" : "text-[var(--os-muted)] hover:text-red-500"}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
                {onReport && (
                  <button
                    onClick={() => onReport(message.id)}
                    className={`text-[10px] inline-flex items-center gap-0.5 ${isMine ? "text-white/80 hover:text-white" : "text-[var(--os-muted)] hover:text-red-500"}`}
                  >
                    <Flag className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
