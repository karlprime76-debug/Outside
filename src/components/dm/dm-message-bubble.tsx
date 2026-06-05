"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Flag, ImageOff, MapPin, Calendar, ExternalLink, UserPlus, Download } from "lucide-react";
import { MediaViewer } from "@/components/media/media-viewer";

export interface DmMessage {
  id: string;
  senderId: string;
  content: string | null;
  isDeleted: boolean;
  createdAt: string;
  status?: string | null;
  type?: string | null;
  momentId?: string | null;
  metadata?: string | null;
  mediaUrl?: string | null;
  mediaPath?: string | null;
  mediaName?: string | null;
  mediaMimeType?: string | null;
  mediaSize?: number | null;
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

function MomentCardInBubble({ momentId, metadata, isMine }: { momentId: string; metadata?: string | null; isMine: boolean }) {
  let parsed: { mediaUrl?: string; caption?: string | null } | null = null;
  try {
    if (metadata) parsed = JSON.parse(metadata);
  } catch { /* noop */ }

  return (
    <Link
      href={`/moments?highlight=${momentId}`}
      className={`block rounded-xl overflow-hidden border transition-colors ${
        isMine
          ? "border-white/20 bg-white/10 hover:bg-white/20"
          : "border-[var(--os-card-border)] bg-[var(--os-bg)] hover:bg-[var(--os-card)]"
      }`}
    >
      {parsed?.mediaUrl ? (
        <div className="relative h-32 w-full bg-black">
          <img
            src={parsed.mediaUrl}
            alt="Moment partagé"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 bg-[var(--os-card)]">
          <div className="text-center">
            <ImageOff className={`h-8 w-8 mx-auto mb-1 ${isMine ? "text-white/50" : "text-[var(--os-muted)]"}`} />
            <span className={`text-xs ${isMine ? "text-white/60" : "text-[var(--os-muted)]"}`}>Moment indisponible</span>
          </div>
        </div>
      )}
      <div className="p-2.5">
        {parsed?.caption ? (
          <p className={`text-xs line-clamp-2 ${isMine ? "text-white/90" : "text-[var(--os-fg)]"}`}>{parsed.caption}</p>
        ) : (
          <p className={`text-xs ${isMine ? "text-white/60" : "text-[var(--os-muted)]"}`}>Moment partagé</p>
        )}
        <span className={`text-[10px] ${isMine ? "text-white/50" : "text-outside-500"}`}>Ouvrir le moment →</span>
      </div>
    </Link>
  );
}

interface PlanMeta {
  planId: string;
  title: string;
  city: string | null;
  startDate: string;
  endDate?: string | null;
  category: string;
  mood: string;
  budgetLevel: string;
  maxParticipants: number;
  status: string;
  creatorId: string;
}

function PlanInviteCard({ metadata, isMine }: { metadata?: string | null; isMine: boolean }) {
  let parsed: PlanMeta | null = null;
  try {
    if (metadata) parsed = JSON.parse(metadata);
  } catch { /* noop */ }

  if (!parsed) {
    return <span className="italic opacity-70">Invitation indisponible</span>;
  }

  const isUnavailable = parsed.status === "CANCELLED" || parsed.status === "COMPLETED";

  return (
    <div
      className={`block rounded-xl overflow-hidden border transition-colors ${
        isMine
          ? "border-white/20 bg-white/10"
          : "border-[var(--os-card-border)] bg-[var(--os-bg)]"
      }`}
    >
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className={`text-sm font-bold ${isMine ? "text-white" : "text-[var(--os-fg)]"}`}>{parsed.title}</h4>
          {isUnavailable && (
            <span className="text-[10px] font-bold uppercase bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Indisponible</span>
          )}
        </div>
        {parsed.city && (
          <div className={`flex items-center gap-1 text-xs ${isMine ? "text-white/80" : "text-[var(--os-muted)]"}`}>
            <MapPin className="h-3 w-3" />
            {parsed.city}
          </div>
        )}
        <div className={`flex items-center gap-1 text-xs ${isMine ? "text-white/80" : "text-[var(--os-muted)]"}`}>
          <Calendar className="h-3 w-3" />
          {new Date(parsed.startDate).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${isMine ? "bg-white/20 text-white" : "bg-[var(--os-card-border)] text-[var(--os-muted)]"}`}>
            {parsed.mood}
          </span>
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${isMine ? "bg-white/20 text-white" : "bg-[var(--os-card-border)] text-[var(--os-muted)]"}`}>
            {parsed.budgetLevel}
          </span>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Link
            href={`/plans/${parsed.planId}`}
            className={`inline-flex items-center gap-1 text-xs font-semibold ${isMine ? "text-white hover:text-white/80" : "text-outside-500 hover:text-outside-600"}`}
          >
            <ExternalLink className="h-3 w-3" />
            Voir
          </Link>
          {!isUnavailable && (
            <button
              onClick={async () => {
                const res = await fetch(`/api/plans/${parsed.planId}/join`, { method: "POST" });
                if (res.ok) window.location.href = `/plans/${parsed.planId}`;
              }}
              className={`inline-flex items-center gap-1 text-xs font-semibold ${isMine ? "text-white hover:text-white/80" : "text-outside-500 hover:text-outside-600"}`}
            >
              <UserPlus className="h-3 w-3" />
              Rejoindre
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MediaMessage({
  url,
  type,
  messageId,
}: {
  url: string;
  type: "image" | "video";
  messageId: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block p-0 border-0 bg-transparent text-left"
      >
        {type === "image" ? (
          <img
            src={url}
            alt="Image"
            className="max-w-full max-h-64 rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <video className="max-w-full max-h-64 rounded-lg" preload="metadata">
            <source src={url} />
          </video>
        )}
      </button>
      {open && (
        <MediaViewer
          src={url}
          type={type}
          alt="DM media"
          onClose={() => setOpen(false)}
          downloadUrl={`/api/dm/messages/${messageId}/download`}
        />
      )}
    </>
  );
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
  const isMoment = message.type === "MOMENT" && !message.isDeleted;
  const isImage = message.type === "IMAGE" && message.mediaUrl && !message.isDeleted;
  const isVideo = message.type === "VIDEO" && message.mediaUrl && !message.isDeleted;
  const isAudio = message.type === "AUDIO" && message.mediaUrl && !message.isDeleted;
  const isPlanInvite = message.type === "PLAN_INVITE" && !message.isDeleted;

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
          ) : isMoment ? (
            <MomentCardInBubble momentId={message.momentId || ""} metadata={message.metadata} isMine={isMine} />
          ) : isPlanInvite ? (
            <PlanInviteCard metadata={message.metadata} isMine={isMine} />
          ) : isImage ? (
            <MediaMessage url={message.mediaUrl || ""} type="image" messageId={message.id} />
          ) : isVideo ? (
            <MediaMessage url={message.mediaUrl || ""} type="video" messageId={message.id} />
          ) : isAudio ? (
            <div className="space-y-1">
              <audio controls className="w-48" src={message.mediaUrl || ""} />
              <a
                href={`/api/dm/messages/${message.id}/download`}
                download
                className={`inline-flex items-center gap-1 text-[10px] ${isMine ? "text-white/70 hover:text-white" : "text-[var(--os-muted)] hover:text-outside-500"}`}
              >
                <Download className="h-3 w-3" />
                Télécharger
              </a>
            </div>
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
