"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { MomentUploadSheet } from "@/components/moments/moment-upload-sheet";
import { Image, Video, MapPin, Plus, ArrowLeft, Flag } from "lucide-react";

interface MomentItem {
  id: string;
  type: string;
  mediaUrl: string;
  caption: string | null;
  city: string | null;
  visibility: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

export default function MomentsPage() {
  const [moments, setMoments] = useState<MomentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "photo" | "video">("all");

  useEffect(() => {
    fetch(`/api/moments?type=${filter === "all" ? "" : filter}`)
      .then((r) => r.json())
      .then((data) => {
        setMoments(data.moments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-4">
      <Link
        href="/home"
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--os-fg)] flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
            <Image className="h-5 w-5 text-white" />
          </div>
          Moments
        </h1>
        <button
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      <div className="flex gap-2">
        {(["all", "photo", "video"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              filter === f
                ? "bg-outside-100 text-outside-700 ring-2 ring-outside-400"
                : "bg-[var(--os-bg)] text-[var(--os-muted)] hover:bg-outside-50"
            }`}
          >
            {f === "all" ? "Tous" : f === "photo" ? "Photos" : "Vidéos"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-[var(--os-bg)] shimmer" />
          ))}
        </div>
      ) : moments.length === 0 ? (
        <div className="os-card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--os-bg)]">
            <Image className="h-6 w-6 text-[var(--os-muted)]" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-[var(--os-fg)]">
            Aucun moment pour le moment
          </h3>
          <p className="mt-1 text-xs text-[var(--os-muted)]">
            Sois le premier à partager ce qui se passe dehors !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {moments.map((m) => (
            <MomentCard key={m.id} moment={m} />
          ))}
        </div>
      )}

      {uploadOpen && (
        <MomentUploadSheet
          onClose={() => setUploadOpen(false)}
          onUploaded={() => {
            fetch(`/api/moments?type=${filter === "all" ? "" : filter}`)
              .then((r) => r.json())
              .then((data) => setMoments(data.moments || []));
          }}
        />
      )}
    </AnimatedPage>
  );
}

function MomentCard({ moment }: { moment: MomentItem }) {
  const isVideo = moment.type === "VIDEO";
  const { addToast } = useToast();

  return (
    <div className="os-card overflow-hidden group">
      <div className="relative aspect-[3/4] bg-black">
        {isVideo ? (
          <video src={moment.mediaUrl} className="h-full w-full object-cover" muted loop playsInline preload="metadata" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={moment.mediaUrl} alt={moment.caption || "Moment"} className="h-full w-full object-cover" loading="lazy" />
        )}
        <div className="absolute top-2 right-2">
          <div className={`rounded-full p-1.5 ${isVideo ? "bg-purple-500/80" : "bg-outside-500/80"}`}>
            {isVideo ? <Video className="h-3 w-3 text-white" /> : <Image className="h-3 w-3 text-white" />}
          </div>
        </div>
        {moment.city && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[10px] font-bold text-white">
            <MapPin className="h-2.5 w-2.5" />
            {moment.city}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Avatar src={moment.author.image} name={moment.author.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[var(--os-fg)] truncate">{moment.author.name || "Anonyme"}</p>
            <p className="text-[10px] text-[var(--os-muted)]">@{moment.author.username || "user"}</p>
          </div>
          <button
            onClick={async () => {
              if (!confirm("Signaler ce moment ?")) return;
              const res = await fetch(`/api/moments/${moment.id}/report`, { method: "POST" });
              if (res.ok) addToast("Moment signalé.", "success");
            }}
            className="text-zinc-300 hover:text-red-500 transition-colors"
            title="Signaler"
          >
            <Flag className="h-3 w-3" />
          </button>
        </div>
        {moment.caption && (
          <p className="text-xs text-[var(--os-fg)] line-clamp-2">{moment.caption}</p>
        )}
      </div>
    </div>
  );
}
