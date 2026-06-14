"use client";

import { useState, useRef, useEffect } from "react";
import { X, Check, RefreshCw, Scissors, Film, Loader2, AlertTriangle } from "lucide-react";
import { processVideo, formatDuration, getFileSizeLabel } from "@/lib/media/process-video";

interface VideoTrimEditorProps {
  videoFile: File;
  onConfirm: (_result: { processedFile: File; startTime: number; endTime: number; duration: number; width: number; height: number }) => void;
  onCancel: () => void;
  maxDuration?: number;
}

type QualityPreset = "high" | "medium" | "low";
type EditorStep = "trim" | "processing";

const QUALITY_OPTIONS: { key: QualityPreset; label: string; desc: string }[] = [
  { key: "high", label: "Haute", desc: "1080p max" },
  { key: "medium", label: "Moyenne", desc: "720p" },
  { key: "low", label: "Basse", desc: "480p" },
];

export function VideoTrimEditor({ videoFile, onConfirm, onCancel, maxDuration = 60 }: VideoTrimEditorProps) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [quality, setQuality] = useState<QualityPreset>("medium");
  const [step, setStep] = useState<EditorStep>("trim");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoSrc(url);

    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.onloadedmetadata = () => {
      setDuration(video.duration);
      setEndTime(Math.min(video.duration, maxDuration));
    };

    return () => URL.revokeObjectURL(url);
  }, [videoFile, maxDuration]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.currentTime >= endTime) {
        video.pause();
        video.currentTime = startTime;
        setIsPlaying(false);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [startTime, endTime]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.currentTime = startTime;
      video.play();
      setIsPlaying(true);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;

    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingStart(true);
  };

  const handleDragEnd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingEnd(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef.current || (!isDraggingStart && !isDraggingEnd)) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * duration;

    if (isDraggingStart) {
      const newStartTime = Math.min(time, endTime - 0.5);
      setStartTime(newStartTime);
      if (videoRef.current) videoRef.current.currentTime = newStartTime;
    } else if (isDraggingEnd) {
      const newEndTime = Math.max(time, startTime + 0.5);
      setEndTime(newEndTime);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingStart(false);
    setIsDraggingEnd(false);
  };

  const handleReset = () => {
    setStartTime(0);
    setEndTime(Math.min(duration, maxDuration));
    setCurrentTime(0);
    if (videoRef.current) videoRef.current.currentTime = 0;
    setError(null);
  };

  const handleProcess = async () => {
    setError(null);
    setStep("processing");
    setProcessingProgress(0);
    setProcessingMessage("Préparation...");

    try {
      setProcessingMessage("Rognage et compression en cours...");

      const result = await processVideo(videoFile, {
        startTime,
        endTime,
        quality,
      });

      setProcessingProgress(80);
      setProcessingMessage("Finalisation...");

      setProcessingProgress(100);
      setProcessingMessage("Terminé !");

      setTimeout(() => {
        onConfirm({
          processedFile: result.file,
          startTime,
          endTime: startTime + result.duration,
          duration: result.duration,
          width: result.width,
          height: result.height,
        });
      }, 300);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors du traitement vidéo";
      setError(msg);
      setStep("trim");
    }
  };

  const selectedDuration = Math.max(0.5, endTime - startTime);
  const isTooLong = selectedDuration > maxDuration;

  const startPercentage = (startTime / duration) * 100 || 0;
  const endPercentage = (endTime / duration) * 100 || 100;
  const currentPercentage = (currentTime / duration) * 100 || 0;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={onCancel}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Annuler"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          {step === "processing" ? (
            <Loader2 className="h-4 w-4 text-outside-400 animate-spin" />
          ) : (
            <Scissors className="h-4 w-4 text-outside-400" />
          )}
          <span className="text-sm font-bold text-white">
            {step === "processing" ? "Traitement..." : "Rogner la vidéo"}
          </span>
        </div>
        <button
          onClick={handleProcess}
          disabled={isTooLong || step === "processing"}
          className="p-2 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 text-white hover:shadow-glow transition-all disabled:opacity-50"
          aria-label="Valider"
        >
          <Check className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 relative bg-black flex items-center justify-center">
        {error && (
          <div className="absolute top-4 left-4 right-4 z-10 rounded-xl bg-red-500/20 border border-red-500/30 p-4 backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {step === "processing" ? (
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-outside-500/20 flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-outside-400 animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1 rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-white font-bold border border-white/10">
                {processingProgress}%
              </div>
            </div>
            <p className="text-sm text-white/70">{processingMessage}</p>
            <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-outside-500 to-accent-500 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <div className="text-xs text-white/50 text-center max-w-xs">
              <p>La vidéo est rognée et compressée directement dans ton navigateur.</p>
              <p className="mt-1">Aucune donnée n&apos;est envoyée à un serveur.</p>
            </div>
          </div>
        ) : !videoSrc ? (
          <div className="flex flex-col items-center gap-3 text-white/40">
            <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-outside-500 animate-spin" />
            <span className="text-sm">Chargement de la vidéo...</span>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoSrc}
            className="max-w-full max-h-full object-contain"
            onClick={handlePlayPause}
          />
        )}

        {step === "trim" && (
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
          >
            <div className="rounded-full bg-white/20 backdrop-blur-sm p-4">
              {isPlaying ? (
                <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-1" />
              ) : (
                <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          </button>
        )}
      </div>

      {step === "trim" && (
        <div className="bg-black/90 backdrop-blur-sm border-t border-white/10 p-4 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-white/70">Sélection:</span>
              <span className={`font-bold ${isTooLong ? "text-red-400" : "text-white"}`}>
                {formatDuration(selectedDuration)}
              </span>
              <span className="text-white/40 text-xs">
                / {formatDuration(duration)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/70">Max:</span>
              <span className="font-bold text-white">{formatDuration(maxDuration)}</span>
            </div>
          </div>

          <div
            ref={timelineRef}
            className="relative h-14 bg-white/10 rounded-lg cursor-pointer"
            onClick={handleTimelineClick}
          >
            <div className="absolute inset-0 flex items-center px-2">
              <div
                className="absolute h-10 bg-outside-500/40 rounded"
                style={{
                  left: `${startPercentage}%`,
                  width: `${endPercentage - startPercentage}%`,
                }}
              />

              <div
                className="absolute h-full w-0.5 bg-white z-10 shadow-lg"
                style={{ left: `${currentPercentage}%` }}
              />

              <div
                className="absolute h-12 w-5 bg-white rounded cursor-ew-resize z-20 flex items-center justify-center shadow-lg"
                style={{ left: `${startPercentage}%`, transform: "translateX(-2px)" }}
                onMouseDown={handleDragStart}
              >
                <div className="w-0.5 h-7 bg-outside-500 rounded mx-0.5" />
              </div>

              <div
                className="absolute h-12 w-5 bg-white rounded cursor-ew-resize z-20 flex items-center justify-center shadow-lg"
                style={{ left: `${endPercentage}%`, transform: "translateX(-2px)" }}
                onMouseDown={handleDragEnd}
              >
                <div className="w-0.5 h-7 bg-outside-500 rounded mx-0.5" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/70">
            <span>{formatDuration(startTime)}</span>
            <span>{formatDuration(endTime)}</span>
          </div>

          {isTooLong && (
            <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-3 text-center">
              <p className="text-xs font-bold text-red-400">
                Réduis la sélection à {formatDuration(maxDuration)} maximum.
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Film className="h-3.5 w-3.5 text-outside-400" />
              <span className="text-xs font-bold text-white/70">Qualité vidéo</span>
              <span className="text-[10px] text-white/40">
                (original: {getFileSizeLabel(videoFile.size)})
              </span>
            </div>
            <div className="flex gap-2">
              {QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setQuality(opt.key)}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-center transition-all ${
                    quality === opt.key
                      ? "bg-gradient-to-r from-outside-500 to-accent-500 text-white shadow-glow"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-[9px] opacity-70">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-xs font-bold">Réinitialiser</span>
            </button>
            <button
              onClick={handleProcess}
              disabled={isTooLong}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 text-white font-bold text-xs hover:shadow-glow transition-all disabled:opacity-50"
            >
              <Scissors className="h-4 w-4" />
              Rogner & compresser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
