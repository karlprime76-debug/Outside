"use client";

import { useState, useEffect, useRef } from "react";
import { X, Film, Loader2, AlertTriangle, Check } from "lucide-react";
import { transcodeVideo, canTranscodeInBrowser, revokeTranscodedUrl } from "@/lib/media/browser-transcoder";

interface VideoTranscoderProps {
  videoFile: File;
  onConfirm: (_result: { processedFile: File; duration: number; width: number; height: number }) => void;
  onCancel: () => void;
}

type TranscoderStep = "checking" | "converting" | "preview" | "error" | "too_large";

export function VideoTranscoder({ videoFile, onConfirm, onCancel }: VideoTranscoderProps) {
  const [step, setStep] = useState<TranscoderStep>("checking");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [convertedFile, setConvertedFile] = useState<File | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function start() {
      const can = await canTranscodeInBrowser(videoFile);
      if (!mounted) return;

      if (!can) {
        setStep("too_large");
        return;
      }

      setStep("converting");

      try {
        const result = await transcodeVideo(videoFile, (pct) => {
          if (mounted) setProgress(pct);
        });

        if (!mounted || cancelledRef.current) {
          revokeTranscodedUrl(result.url);
          return;
        }

        setConvertedFile(result.file);
        setConvertedUrl(result.url);
        setStep("preview");
      } catch (err) {
        if (!mounted) return;
        setErrorMessage(err instanceof Error ? err.message : "Erreur de conversion");
        setStep("error");
      }
    }

    start();

    return () => {
      mounted = false;
      cancelledRef.current = true;
    };
  }, [videoFile]);

  useEffect(() => {
    if (step !== "preview" || !convertedUrl) return;

    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      setDuration(video.duration);
      setDimensions({ width: video.videoWidth, height: video.videoHeight });
    };
    video.src = convertedUrl;
  }, [step, convertedUrl]);

  const handleConfirm = () => {
    if (convertedFile) {
      onConfirm({
        processedFile: convertedFile,
        duration,
        width: dimensions.width,
        height: dimensions.height,
      });
    }
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    if (convertedUrl) revokeTranscodedUrl(convertedUrl);
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--os-card)] border border-[var(--os-card-border)] p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[var(--os-fg)]">
            {step === "checking" && "Préparation..."}
            {step === "converting" && "Conversion en cours"}
            {step === "preview" && "Aperçu de la vidéo"}
            {step === "error" && "Conversion impossible"}
            {step === "too_large" && "Fichier trop volumineux"}
          </h2>
          <button
            onClick={handleCancel}
            className="rounded-full p-2 text-[var(--os-muted)] hover:text-[var(--os-fg)] hover:bg-[var(--os-card-border)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Checking state */}
        {step === "checking" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-outside-400" />
            <p className="text-sm text-[var(--os-muted)]">Vérification du fichier...</p>
          </div>
        )}

        {/* Converting state */}
        {step === "converting" && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-outside-500/10 p-3">
                <Film className="h-8 w-8 text-outside-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--os-fg)]">
                  Conversion au format MP4
                </p>
                <p className="text-xs text-[var(--os-muted)] mt-1">
                  {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} Mo)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[var(--os-muted)]">
                <span>Progression</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--os-card-border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-outside-500 to-accent-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-center text-[var(--os-muted)]">
              La vidéo est convertie localement sur ton appareil. Aucune donnée n&apos;est envoyée.
            </p>
          </div>
        )}

        {/* Preview state */}
        {step === "preview" && convertedUrl && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-black max-h-[50vh] flex items-center justify-center">
              <video
                ref={videoRef}
                src={convertedUrl}
                className="max-w-full max-h-[50vh] object-contain"
                controls
                autoPlay
                muted
                loop
                playsInline
              />
            </div>

            <div className="rounded-xl bg-[var(--os-bg)] border border-[var(--os-card-border)] p-3 grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <p className="text-[var(--os-muted)]">Format</p>
                <p className="font-bold text-[var(--os-fg)]">MP4</p>
              </div>
              <div>
                <p className="text-[var(--os-muted)]">Taille</p>
                <p className="font-bold text-[var(--os-fg)]">
                  {convertedFile ? (convertedFile.size / (1024 * 1024)).toFixed(1) : "..."} Mo
                </p>
              </div>
              <div>
                <p className="text-[var(--os-muted)]">Durée</p>
                <p className="font-bold text-[var(--os-fg)]">
                  {duration ? `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, "0")}` : "..."}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-xl border border-[var(--os-card-border)] py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                Utiliser cette vidéo
              </button>
            </div>
          </div>
        )}

        {/* Error state */}
        {step === "error" && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-red-500/10 p-3">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--os-fg)]">
                  Impossible de convertir cette vidéo
                </p>
                {errorMessage && (
                  <p className="text-xs text-[var(--os-muted)] mt-1">{errorMessage}</p>
                )}
                <p className="text-xs text-[var(--os-muted)] mt-2">
                  Le fichier sera publié dans son format d&apos;origine.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-[var(--os-bg)] border border-[var(--os-card-border)] p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--os-muted)]">Fichier</span>
                <span className="font-bold text-[var(--os-fg)] truncate max-w-[200px]">{videoFile.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--os-muted)]">Format</span>
                <span className="font-bold text-[var(--os-fg)]">{videoFile.type || "inconnu"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--os-muted)]">Taille</span>
                <span className="font-bold text-[var(--os-fg)]">{(videoFile.size / (1024 * 1024)).toFixed(1)} Mo</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-xl border border-[var(--os-card-border)] py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => onConfirm({
                  processedFile: videoFile,
                  duration: 0,
                  width: 0,
                  height: 0,
                })}
                className="flex-1 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all active:scale-[0.98]"
              >
                Publier quand même
              </button>
            </div>
          </div>
        )}

        {/* Too large state */}
        {step === "too_large" && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-amber-500/10 p-3">
                <AlertTriangle className="h-8 w-8 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--os-fg)]">
                  Fichier trop volumineux pour la conversion
                </p>
                <p className="text-xs text-[var(--os-muted)] mt-1">
                  {(videoFile.size / (1024 * 1024)).toFixed(1)} Mo — la conversion locale est limitée à 500 Mo.
                </p>
                <p className="text-xs text-[var(--os-muted)] mt-2">
                  Le fichier sera publié dans son format d&apos;origine.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-xl border border-[var(--os-card-border)] py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => onConfirm({
                  processedFile: videoFile,
                  duration: 0,
                  width: 0,
                  height: 0,
                })}
                className="flex-1 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all active:scale-[0.98]"
              >
                Publier quand même
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
