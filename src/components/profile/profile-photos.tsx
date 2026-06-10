"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { OutsideEmptyState } from "@/components/ui/outside-empty-state";

interface PhotoItem {
  id: string;
  mediaUrl: string;
  caption: string | null;
  createdAt: string;
  _count: { likes: number; comments: number };
}

export function ProfilePhotos({ initial, noPhotos, noPhotosDesc }: { initial: PhotoItem[]; noPhotos: string; noPhotosDesc: string }) {
  const [photos] = useState<PhotoItem[]>(initial);

  if (photos.length === 0) {
    return <OutsideEmptyState icon={ImageIcon} title={noPhotos} description={noPhotosDesc} />;
  }

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {photos.map((p) => (
        <button
          key={p.id}
          className="relative aspect-square overflow-hidden rounded-lg bg-[var(--os-bg)] group"
        >
          <img src={p.mediaUrl} alt={p.caption || ""} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </button>
      ))}
    </div>
  );
}
