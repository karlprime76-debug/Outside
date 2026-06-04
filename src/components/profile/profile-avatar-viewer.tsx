"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { MediaViewer } from "@/components/media/media-viewer";

interface ProfileAvatarViewerProps {
  src: string | null;
  name: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

export function ProfileAvatarViewer({ src, name, size = "xl" }: ProfileAvatarViewerProps) {
  const [open, setOpen] = useState(false);

  if (!src) {
    return <Avatar src={src} name={name} size={size} />;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-0 border-0 bg-transparent rounded-full"
        aria-label="Voir la photo de profil"
      >
        <Avatar src={src} name={name} size={size} />
      </button>
      {open && (
        <MediaViewer src={src} type="image" alt={name || "Photo de profil"} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
