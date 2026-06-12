"use client";

import { useMemo } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Heart, MessageCircle, SendHorizonal, Bookmark, MapPin, Globe, Users, Lock } from "lucide-react";

interface PreviewAuthor {
  name: string | null;
  image: string | null;
  username: string | null;
}

interface MomentPreviewProps {
  mediaUrl: string;
  type: "PHOTO" | "VIDEO";
  caption: string;
  city: string;
  visibility: string;
  author: PreviewAuthor;
  videoStartTime?: number;
  videoEndTime?: number;
}

export function MomentPreview({
  mediaUrl,
  type,
  caption,
  city,
  visibility,
  author,
  videoStartTime,
  videoEndTime,
}: MomentPreviewProps) {
  const isVideo = type === "VIDEO";

  const visibilityIcon = useMemo(() => {
    switch (visibility) {
      case "FRIENDS": return <Users className="h-3 w-3" />;
      case "PLAN_PARTICIPANTS": return <Users className="h-3 w-3" />;
      case "PRIVATE": return <Lock className="h-3 w-3" />;
      default: return <Globe className="h-3 w-3" />;
    }
  }, [visibility]);

  const visibilityLabel = useMemo(() => {
    switch (visibility) {
      case "FRIENDS": return "Amis";
      case "PLAN_PARTICIPANTS": return "Participants";
      case "PRIVATE": return "Privé";
      default: return "Public";
    }
  }, [visibility]);

  return (
    <div className="bg-[var(--os-card)] border border-[var(--os-card-border)] rounded-2xl overflow-hidden max-w-[500px] mx-auto shadow-lg">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar src={author.image} name={author.name} size="sm" />
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[var(--os-fg)] truncate">
              {author.name || "Toi"}
            </p>
            <p className="text-[11px] text-[var(--os-muted)] truncate leading-tight">
              @{author.username || "vous"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="rounded-full bg-[var(--os-bg)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--os-muted)] border border-[var(--os-card-border)] flex items-center gap-1">
            {visibilityIcon}
            {visibilityLabel}
          </span>
        </div>
      </div>

      <div className="relative aspect-[4/5] bg-black overflow-hidden">
        {isVideo ? (
          <video
            src={mediaUrl}
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
            controls
            preload="metadata"
            onLoadedMetadata={(e) => {
              const el = e.target as HTMLVideoElement;
              if (videoStartTime != null) el.currentTime = videoStartTime;
            }}
            onTimeUpdate={(e) => {
              const el = e.target as HTMLVideoElement;
              if (videoEndTime != null && el.currentTime >= videoEndTime) {
                if (videoStartTime != null) el.currentTime = videoStartTime;
              }
            }}
          />
        ) : (
          <img
            src={mediaUrl}
            alt="Aperçu"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="px-3 pt-2.5 pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="p-2.5 text-[var(--os-fg)] opacity-50">
              <Heart className="h-6 w-6" />
            </div>
            <div className="p-2.5 text-[var(--os-fg)] opacity-50">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div className="p-2.5 text-[var(--os-fg)] opacity-50">
              <SendHorizonal className="h-6 w-6" />
            </div>
          </div>
          <div className="p-2.5 text-[var(--os-fg)] opacity-50">
            <Bookmark className="h-6 w-6" />
          </div>
        </div>

        {caption && (
          <p className="text-[13px] text-[var(--os-fg)] leading-relaxed">
            <span className="font-bold">{author.name || "Toi"}</span>{" "}
            <span className="text-[var(--os-muted)]">{caption}</span>
          </p>
        )}

        {city && (
          <p className="text-xs text-outside-500 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {city}
          </p>
        )}

        <p className="text-[11px] text-[var(--os-muted)]">À l&apos;instant</p>
      </div>
    </div>
  );
}
