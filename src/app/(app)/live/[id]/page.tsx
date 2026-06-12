"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, WifiOff, RefreshCw } from "lucide-react";
import { ReportButton } from "@/components/report-button";

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

const HEARTBEAT_INTERVAL = 30_000;

export default function LiveDetailPage() {
  const { id } = useParams() as { id: string };
  const { data: session } = useSession();
  const [live, setLive] = useState<LiveDetail | null>(null);
  const [tokenData, setTokenData] = useState<{ token: string; url: string; roomName: string; isHost: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reconnecting, setReconnecting] = useState(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const init = async () => {
      try {
        const liveRes = await fetch(`/api/lives/${id}`);
        if (cancelled || !mountedRef.current) return;
        if (!liveRes.ok) {
          setError("Live introuvable.");
          setLoading(false);
          return;
        }
        const liveData = await liveRes.json();
        if (cancelled || !mountedRef.current) return;
        if (!liveData?.live) {
          setError("Live introuvable.");
          setLoading(false);
          return;
        }

        setLive(liveData.live);

        if (!session?.user?.email) {
          setLoading(false);
          return;
        }

        const isHost = liveData.live.hostId === session.user.id;
        const tokenRes = await fetch(`/api/lives/${id}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: isHost ? "host" : "viewer" }),
        });
        if (cancelled || !mountedRef.current) return;

        if (!tokenRes.ok) {
          const errData = await tokenRes.json().catch(() => ({}));
          setError(errData?.message || "Impossible de rejoindre ce live.");
        } else {
          const data = await tokenRes.json();
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
        }
      } catch {
        if (!cancelled && mountedRef.current) setError("Erreur réseau.");
      }
      if (!cancelled && mountedRef.current) setLoading(false);
    };

    init();
    return () => { cancelled = true; mountedRef.current = false; };
  }, [id, session?.user?.email]);

  // Heartbeat for host
  useEffect(() => {
    if (!tokenData?.isHost || !id) return;

    const sendHeartbeat = () => {
      fetch(`/api/lives/${id}/heartbeat`, { method: "POST" }).catch(() => {});
    };

    sendHeartbeat();
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [tokenData?.isHost, id]);

  const handleDisconnected = () => {
    if (tokenData?.isHost) {
      fetch(`/api/lives/${id}/end`, { method: "POST" }).catch((err) => { console.error("[LIVE_ERROR] Failed to end live:", err); });
    }
    window.location.href = "/live";
  };

  const handleReconnect = async () => {
    if (!session?.user?.email || !live) return;
    setReconnecting(true);
    try {
      const isHost = live.hostId === session.user.id;
      const res = await fetch(`/api/lives/${id}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: isHost ? "host" : "viewer" }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData?.message || "Impossible de rejoindre.");
        return;
      }
      const data = await res.json();
      if (data?.token && data?.url && data?.roomName) {
        setTokenData({
          token: data.token,
          url: data.url,
          roomName: data.roomName,
          isHost: data.isHost ?? false,
        });
        setError("");
      }
    } catch {
      setError("Erreur réseau.");
    }
    setReconnecting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-black via-zinc-950 to-black">
        <LoadingScreen size="sm" />
      </div>
    );
  }

  if (error || !live || !tokenData) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-black via-zinc-950 to-black text-white p-6 text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <WifiOff className="h-7 w-7 text-red-400" />
          </div>
          <p className="text-lg font-bold text-white mb-1">Live indisponible</p>
          <p className="text-sm text-white/60 max-w-xs">{error || "Le live est peut-être terminé ou momentanément inaccessible."}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReconnect}
            disabled={reconnecting}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${reconnecting ? "animate-spin" : ""}`} />
            {reconnecting ? "Reconnexion..." : "Réessayer"}
          </button>
          <Link
            href="/live"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-5 py-2.5 text-xs font-bold text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Link>
        </div>
      </div>
    );
  }

  if (live.status !== "LIVE") {
    const endedText = live.status === "ENDED" ? "Ce live est terminé." : live.status === "CANCELLED" ? "Ce live a été annulé." : "Ce live n'est pas en direct.";
    const isHost = session?.user?.id === live.hostId;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-black via-zinc-950 to-black text-white p-6 text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <WifiOff className="h-7 w-7 text-white/40" />
          </div>
          <p className="text-lg font-bold text-white mb-1">Live terminé</p>
          <p className="text-sm text-white/60">{endedText}</p>
        </div>
        <Link
          href="/live"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voir les lives en direct
        </Link>
        {!isHost && (
          <div className="mt-6">
            <ReportButton targetType="LIVE" targetId={live.id} />
          </div>
        )}
      </div>
    );
  }

  return (
    <LiveKitRoomView
      token={tokenData.token}
      serverUrl={tokenData.url}
      roomName={tokenData.roomName}
      isHost={tokenData.isHost}
      liveId={id}
      onDisconnected={handleDisconnected}
    />
  );
}