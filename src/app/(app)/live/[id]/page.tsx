"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const LiveKitRoomView = dynamic(() => import("@/components/live/livekit-room-view"), { ssr: false });

interface LiveDetail {
  id: string;
  title: string;
  status: string;
  hostId: string;
  city?: string | null;
  livekitRoomName?: string | null;
  host: { id: string; name: string | null; image: string | null };
}

export default function LiveDetailPage() {
  const { id } = useParams() as { id: string };
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [live, setLive] = useState<LiveDetail | null>(null);
  const [tokenData, setTokenData] = useState<{ token: string; url: string; roomName: string; isHost: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/lives/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.live) {
          setLive(data.live);
        } else {
          setError("Live introuvable.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur de chargement.");
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!live || !session?.user?.email) return;
    const isHost = live.hostId === session.user.id;
    fetch(`/api/lives/${id}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: isHost ? "host" : "viewer" }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.token && data?.url && data?.roomName) {
          setTokenData({
            token: data.token,
            url: data.url,
            roomName: data.roomName,
            isHost: data.isHost ?? false,
          });
        } else {
          setError(data?.message || "Impossible de rejoindre ce live.");
        }
      })
      .catch(() => setError("Erreur réseau."));
  }, [live, id, session]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black">
        <LoadingScreen size="sm" />
      </div>
    );
  }

  if (error || !live || !tokenData) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-black text-white p-6 text-center">
        <p className="text-sm font-semibold text-red-400 mb-2">{error || "Live indisponible."}</p>
        <Link
          href="/live"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour aux lives
        </Link>
      </div>
    );
  }

  if (live && live.status && live.status !== "LIVE") {
    const endedText = live.status === "ENDED" ? "Ce live est terminé." : live.status === "CANCELLED" ? "Ce live a été annulé." : "Ce live n'est pas en direct.";
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-black text-white p-6 text-center">
        <p className="text-sm font-semibold text-white/80 mb-2">{endedText}</p>
        <Link
          href="/live"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour aux lives
        </Link>
      </div>
    );
  }

  return (
    <LiveKitRoomView
      token={tokenData.token}
      serverUrl={tokenData.url}
      roomName={tokenData.roomName}
      isHost={tokenData.isHost}
      onDisconnected={() => {
        if (tokenData.isHost) {
          fetch(`/api/lives/${id}/end`, { method: "POST" }).catch(() => {});
        }
        window.location.href = "/live";
      }}
    />
  );
}
