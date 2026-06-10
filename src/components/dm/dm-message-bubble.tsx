"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Flag, ImageOff, MapPin, Calendar, ExternalLink, UserPlus, Download, Heart, User, RefreshCw } from "lucide-react";
import { MediaViewer } from "@/components/media/media-viewer";
import { useClickOutside } from "@/hooks/use-click-outside";

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
  reactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      username: string | null;
    };
  }>;
}

interface DmMessageBubbleProps {
  message: DmMessage;
  isMine: boolean;
  showAvatar?: boolean;
  otherImage?: string | null;
  otherName?: string | null;
  myId?: string;
  onDelete?: (id: string) => void;
  onReport?: (id: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onRetry?: (id: string) => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

const ALLOWED_EMOJIS = ["❤️", "😂", "🔥", "👀", "🙌"];

function MessageReactions({
  reactions = [],
  myId,
  onReact,
  messageId,
  isMine,
}: {
  reactions: DmMessage["reactions"];
  myId?: string;
  onReact?: (messageId: string, emoji: string) => void;
  messageId: string;
  isMine: boolean;
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  useClickOutside(pickerRef, () => setShowEmojiPicker(false), showEmojiPicker);

  // Group reactions by emoji
  const grouped = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push(r);
    return acc;
  }, {} as Record<string, typeof reactions>);

  const handleReact = async (emoji: string) => {
    if (onReact) {
      await onReact(messageId, emoji);
    }
    setShowEmojiPicker(false);
  };

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1">
        {Object.entries(grouped).map(([emoji, users]) => {
          const hasReacted = myId && users.some((u) => u.userId === myId);
          return (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                hasReacted
                  ? isMine
                    ? "bg-white/20 text-white"
                    : "bg-outside-100 text-outside-700"
                  : isMine
                    ? "bg-white/10 text-white/70 hover:bg-white/20"
                    : "bg-[var(--os-card-border)] text-[var(--os-muted)] hover:bg-outside-50"
              } transition-colors`}
            >
              <span>{emoji}</span>
              <span className="text-[10px]">{users.length}</span>
            </button>
          );
        })}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
            isMine
              ? "bg-white/10 text-white/70 hover:bg-white/20"
              : "bg-[var(--os-card-border)] text-[var(--os-muted)] hover:bg-outside-50"
          } transition-colors`}
        >
          <Heart className="h-3 w-3" />
        </button>
      </div>
      {showEmojiPicker && (
        <div ref={pickerRef} className="flex gap-1 mt-2">
          {ALLOWED_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className="w-8 h-8 rounded-full bg-[var(--os-card)] border border-[var(--os-card-border)] hover:bg-outside-50 transition-colors text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MomentCardInBubble({ momentId, metadata, isMine }: { momentId: string; metadata?: string | null; isMine: boolean }) {
  let parsed: { mediaUrl?: string; caption?: string | null } | null = null;
  try {
    if (metadata) parsed = JSON.parse(metadata);
  } catch (e) {
    console.error("[PARSE_MOMENT_META]", e);
  }

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
          <Image
            src={parsed.mediaUrl}
            alt="Moment partagé"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 80vw, 400px"
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
  } catch (e) {
    console.error("[PARSE_PLAN_META]", e);
  }

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

function ProfileCard({ metadata, isMine }: { metadata?: string | null; isMine: boolean }) {
  let parsed: { userId?: string; name?: string | null; username?: string | null; image?: string | null } | null = null;
  try {
    if (metadata) parsed = JSON.parse(metadata);
  } catch {
    // ignore
  }

  const name = parsed?.name || "Utilisateur";
  const username = parsed?.username || "";
  const image = parsed?.image || null;
  const userId = parsed?.userId || "";

  return (
    <Link
      href={`/u/${username || userId}`}
      className={`block rounded-xl overflow-hidden border transition-colors ${
        isMine
          ? "border-white/20 bg-white/10 hover:bg-white/20"
          : "border-[var(--os-card-border)] bg-[var(--os-bg)] hover:bg-[var(--os-card)]"
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        {image ? (
          <Image src={image} alt={name} width={48} height={48} className="rounded-full object-cover" />
        ) : (
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isMine ? "bg-white/20" : "bg-[var(--os-card-border)]"}`}>
            <User className={`h-6 w-6 ${isMine ? "text-white/60" : "text-[var(--os-muted)]"}`} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-bold truncate ${isMine ? "text-white" : "text-[var(--os-fg)]"}`}>{name}</span>
            {username && <span className={`text-[10px] ${isMine ? "text-outside-300" : "text-outside-500"}`}>@{username}</span>}
          </div>
          <span className={`text-xs ${isMine ? "text-white/60" : "text-outside-500"}`}>Voir le profil →</span>
        </div>
      </div>
    </Link>
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
          <Image
            src={url}
            alt="Image"
            width={320}
            height={240}
            className="max-w-full max-h-64 rounded-lg object-cover"
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
  myId,
  onDelete,
  onReport,
  onReact,
  onRetry,
}: DmMessageBubbleProps) {
  const isMoment = message.type === "MOMENT" && !message.isDeleted;
  const isImage = message.type === "IMAGE" && message.mediaUrl && !message.isDeleted;
  const isVideo = message.type === "VIDEO" && message.mediaUrl && !message.isDeleted;
  const isAudio = message.type === "AUDIO" && message.mediaUrl && !message.isDeleted;
  const isPlanInvite = message.type === "PLAN_INVITE" && !message.isDeleted;
  const isProfile = message.type === "PROFILE" && !message.isDeleted;

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
      <div className="flex items-end gap-1.5 max-w-[80%]">
        {/* Avatar for received messages */}
        {!isMine && showAvatar && (
          <div className="shrink-0 pb-1">
            <Image
              src={otherImage || ""}
              alt={otherName || ""}
              width={24}
              height={24}
              className="rounded-full object-cover bg-[var(--os-card)]"
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
          ) : isProfile ? (
            <ProfileCard metadata={message.metadata} isMine={isMine} />
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

          {/* Reactions */}
          {!message.isDeleted && onReact && message.reactions && message.reactions.length > 0 && (
            <MessageReactions
              reactions={message.reactions}
              myId={myId}
              onReact={onReact}
              messageId={message.id}
              isMine={isMine}
            />
          )}

          {/* Time + actions */}
          <div className="flex items-center justify-end gap-2 mt-1">
            {isMine && message.status === "FAILED" && (
              <button
                onClick={() => onRetry?.(message.id)}
                className="text-[10px] inline-flex items-center gap-0.5 text-red-400 hover:text-red-300"
              >
                <RefreshCw className="h-3 w-3" />
                Réessayer
              </button>
            )}
            <span className={`text-[10px] ${isMine ? "text-white/70" : "text-[var(--os-muted)]"}`}>
              {formatTime(message.createdAt)}
            </span>
            {isMine && message.status === "SENDING" && (
              <span className="text-[10px] text-white/50">Envoi...</span>
            )}
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
