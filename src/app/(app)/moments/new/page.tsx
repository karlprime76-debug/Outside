"use client";

import dynamic from "next/dynamic";
import { Suspense, useState, useRef, ChangeEvent, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { AnimatedPage } from "@/components/ui/animated-page";
import { useMomentDraft } from "@/hooks/use-moment-draft";
import {
  Image as ImageIcon, Upload, MapPin,
  Music, Trash2,
  CheckCircle2, AlertCircle, Camera, Film,
  ChevronLeft,
  SlidersHorizontal,
} from "lucide-react";
import { compressImage, shouldCompressImage } from "@/lib/media/compress-image";

const AudioPicker = dynamic(() => import("@/components/audio/audio-picker").then((m) => ({ default: m.AudioPicker })), { ssr: false });
const ImageCropEditor = dynamic(() => import("@/components/media/image-crop-editor").then((m) => ({ default: m.ImageCropEditor })), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-outside-500 animate-spin" />
    </div>
  ),
});
const VideoTrimEditor = dynamic(() => import("@/components/media/video-trim-editor").then((m) => ({ default: m.VideoTrimEditor })), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-outside-500 animate-spin" />
    </div>
  ),
});
const UploadProgressComponent = dynamic(() => import("@/components/upload/upload-progress").then((m) => ({ default: m.UploadProgressComponent })), { ssr: false });

type Step = "select" | "edit" | "details" | "publish";

interface UploadState {
  status: "preparing" | "init" | "uploading" | "creating" | "completed" | "error";
  percentage: number;
  message?: string;
}

export default function NewMomentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--os-bg)]" />}>
      <NewMomentForm />
    </Suspense>
  );
}

function NewMomentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("select");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [audioTrack, setAudioTrack] = useState<{ id: string; title: string; artistName: string | null } | null>(null);
  const [audioVolume, setAudioVolume] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isOriginalAudio, setIsOriginalAudio] = useState(false);
  const [mediaType, setMediaType] = useState<"PHOTO" | "VIDEO">("PHOTO");

  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [mediaMetadata, setMediaMetadata] = useState({
    mediaWidth: undefined as number | undefined,
    mediaHeight: undefined as number | undefined,
    mediaDuration: undefined as number | undefined,
    mediaCrop: undefined as Record<string, unknown> | undefined,
    videoStartTime: undefined as number | undefined,
    videoEndTime: undefined as number | undefined,
    mediaAspectRatio: undefined as string | undefined,
  });

  const { data: session } = useSession();
  const draft = useMomentDraft(session?.user?.id);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user;
        const fallbackCity = u?.activeCity?.name || u?.homeCity?.name || "";
        const existing = draft.restoreDraft();
        if (existing) {
          setShowDraftPrompt(true);
          setCity(existing.city || fallbackCity);
          setCaption(existing.caption || "");
          setVisibility(existing.visibility || "PUBLIC");
        } else {
          setCity(fallbackCity);
        }
      })
      .catch(() => {});
  }, [draft]);

  useEffect(() => {
    const audioTrackId = searchParams.get("audioTrackId");
    if (audioTrackId) {
      fetch(`/api/audio/${audioTrackId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.track) {
            setAudioTrack({
              id: data.track.id,
              title: data.track.title,
              artistName: data.track.artistName,
            });
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  useEffect(() => {
    if (caption || city || visibility !== "PUBLIC") {
      draft.saveDraft({ caption, visibility, city, publishAsClip: false });
    }
  }, [caption, visibility, city, draft]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowed = [
      "image/jpeg", "image/png", "image/webp",
      "video/mp4", "video/webm", "video/quicktime",
    ];
    if (!allowed.includes(selected.type)) {
      addToast("Format non accepté. Utilise JPG, PNG, WebP, MP4 ou WebM.", "error");
      return;
    }

    const maxSize = selected.type.startsWith("video/") ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (selected.size > maxSize) {
      addToast(selected.type.startsWith("video/") ? "Vidéo max 50 Mo" : "Photo max 5 Mo", "error");
      return;
    }

    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreview(url);

    if (selected.type.startsWith("video/")) {
      setMediaType("VIDEO");
      try {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.onloadedmetadata = () => {
          setShowVideoEditor(true);
          setStep("edit");
        };
        v.onerror = () => {
          addToast("Format vidéo non supporté", "error");
        };
        v.src = url;
      } catch {
        setShowVideoEditor(true);
        setStep("edit");
      }
    } else {
      setMediaType("PHOTO");
      setShowImageEditor(true);
      setStep("edit");
    }
  }

  const handleImageCropConfirm = (croppedFile: File) => {
    setFile(croppedFile);
    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(croppedFile);
    setPreview(url);
    setShowImageEditor(false);
    const img = new Image();
    img.onload = () => {
      setMediaMetadata((prev) => ({
        ...prev,
        mediaWidth: img.width,
        mediaHeight: img.height,
        mediaAspectRatio: `${img.width}:${img.height}`,
      }));
    };
    img.src = url;
    setStep("details");
  };

  const handleVideoTrimConfirm = (result: {
    processedFile: File;
    startTime: number;
    endTime: number;
    duration: number;
    width: number;
    height: number;
  }) => {
    setFile(result.processedFile);
    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(result.processedFile);
    setPreview(url);
    setMediaMetadata((prev) => ({
      ...prev,
      videoStartTime: result.startTime,
      videoEndTime: result.endTime,
      mediaDuration: result.duration,
      mediaWidth: result.width,
      mediaHeight: result.height,
      mediaAspectRatio: `${result.width}:${result.height}`,
    }));
    setShowVideoEditor(false);
    setStep("details");
  };

  function handleImageEditCancel() {
    setShowImageEditor(false);
    setFile(null);
    setPreview(null);
    setStep("select");
  }

  function handleVideoEditCancel() {
    setShowVideoEditor(false);
    setFile(null);
    setPreview(null);
    setStep("select");
  }

  async function uploadFile(
    signedUrl: string,
    fileToUpload: File,
    onProgress: (pct: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signedUrl, true);
      xhr.setRequestHeader("Content-Type", fileToUpload.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Upload network error"));
      xhr.send(fileToUpload);
    });
  }

  async function submit() {
    if (!file) return;

    const hasContext = city.trim();
    if (!hasContext) {
      addToast("Un moment doit être lié à une ville.", "error");
      return;
    }

    setLoading(true);
    setStep("publish");
    setUploadState({ status: "preparing", percentage: 0 });

    try {
      let fileToUpload = file;
      if (shouldCompressImage(file) && mediaType === "PHOTO") {
        setUploadState({ status: "preparing", percentage: 5, message: "Compression de l'image..." });
        try {
          const result = await compressImage(file);
          fileToUpload = result.compressedFile;
        } catch {
          fileToUpload = file;
        }
      }

      // Step 1: Init upload — get presigned URL
      setUploadState({ status: "init", percentage: 10, message: "Préparation de l'upload..." });
      const initRes = await fetch("/api/moments/init-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileType: fileToUpload.type }),
      });

      if (!initRes.ok) {
        const err = await initRes.json().catch(() => ({}));
        throw new Error(err.error || "Erreur d'initialisation");
      }

      const { signedUrl, filePath, publicUrl } = await initRes.json();

      // Step 2: Upload file directly to Supabase via presigned URL
      setUploadState({ status: "uploading", percentage: 15, message: "Envoi en cours..." });

      await uploadFile(signedUrl, fileToUpload, (pct) => {
        const mappedPct = 15 + Math.round(pct * 0.6);
        setUploadState((prev) => ({
          ...prev,
          status: "uploading" as const,
          percentage: mappedPct,
          message: `Envoi en cours... ${pct}%`,
        }));
      });

      // Step 3: Create moment record
      setUploadState({ status: "creating", percentage: 85, message: "Finalisation..." });

      const createRes = await fetch("/api/moments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath,
          publicUrl,
          fileType: fileToUpload.type,
          caption: caption.trim() || null,
          visibility,
          city: city.trim() || null,
          audioTrackId: audioTrack?.id || null,
          audioVolume,
          mediaWidth: mediaMetadata.mediaWidth,
          mediaHeight: mediaMetadata.mediaHeight,
          mediaDuration: mediaMetadata.mediaDuration,
          mediaCrop: mediaMetadata.mediaCrop ? JSON.stringify(mediaMetadata.mediaCrop) : null,
          videoStartTime: mediaMetadata.videoStartTime,
          videoEndTime: mediaMetadata.videoEndTime,
          mediaAspectRatio: mediaMetadata.mediaAspectRatio,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de la création du moment");
      }

      draft.clearDraft();
      setUploadState({ status: "completed", percentage: 100 });
      addToast("Moment publié !", "success");

      setTimeout(() => {
        router.push("/moments");
        router.refresh();
      }, 800);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur réseau";
      addToast(errorMessage, "error");
      setUploadState({ status: "error", percentage: 0, message: errorMessage });
      setLoading(false);
    }
  }

  const goToEdit = useCallback(() => {
    if (preview) {
      if (mediaType === "VIDEO") {
        setShowVideoEditor(true);
      } else {
        setShowImageEditor(true);
      }
      setStep("edit");
    }
  }, [preview, mediaType]);

  return (
    <div className="min-h-screen bg-[var(--os-bg)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--os-bg)] border-b border-[var(--os-card-border)]">
        <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto">
          <Link
            href="/moments"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Retour
          </Link>

          <h1 className="text-base font-extrabold text-[var(--os-fg)]">
            {step === "select" && "Nouveau moment"}
            {step === "edit" && "Éditer le média"}
            {step === "details" && "Détails"}
            {step === "publish" && "Publication"}
          </h1>

          <div className="w-20" />
        </div>
      </header>

      <AnimatedPage className="max-w-4xl mx-auto pb-24 md:pb-8">
        {/* Draft prompt */}
        {showDraftPrompt && step === "select" && (
          <div className="mx-4 mb-4 mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 space-y-3 dark:border-sky-900 dark:bg-sky-950/20">
            <p className="text-sm font-bold text-sky-800 dark:text-sky-300">
              Reprendre ton brouillon ?
            </p>
            <p className="text-xs text-sky-600 dark:text-sky-400">
              Tu avais commencé un Moment sans le publier.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDraftPrompt(false)}
                className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 transition-colors"
              >
                Reprendre
              </button>
              <button
                onClick={() => {
                  draft.clearDraft();
                  setShowDraftPrompt(false);
                  setCaption("");
                  setVisibility("PUBLIC");
                  setCity("");
                }}
                className="rounded-lg border border-sky-300 px-4 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100 transition-colors dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-900/30"
              >
                Supprimer
              </button>
            </div>
          </div>
        )}

        {/* Step: Select file */}
        {step === "select" && !file && (
          <div className="p-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed border-[var(--os-card-border)] bg-[var(--os-bg)] py-24 px-8 cursor-pointer hover:border-outside-400 hover:bg-outside-500/[0.02] transition-all group"
            >
              <div className="rounded-full bg-gradient-to-br from-outside-500/15 to-accent-500/15 p-6 group-hover:scale-110 transition-transform">
                <Camera className="h-14 w-14 text-outside-400" />
              </div>
              <div className="text-center">
                <p className="text-xl font-extrabold text-[var(--os-fg)]">
                  Ajoute une photo ou une vidéo
                </p>
                <p className="text-sm text-[var(--os-muted)] mt-1">
                  Choisis un média pour immortaliser ce moment
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <div className="flex items-center gap-1.5 rounded-full bg-outside-500/10 px-4 py-2 text-xs font-bold text-outside-400">
                  <ImageIcon className="h-4 w-4" />
                  JPG · PNG · WebP
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-accent-500/10 px-4 py-2 text-xs font-bold text-accent-400">
                  <Film className="h-4 w-4" />
                  MP4 · WebM
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Step: Details + Preview */}
        {step === "details" && file && preview && (
          <div className="p-4 space-y-5 animate-fade-in">
            {/* Media preview — large, immersive */}
            <div className="relative rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 max-h-[60vh] flex items-center justify-center">
              {mediaType === "VIDEO" ? (
                <video
                  src={preview}
                  className="max-w-full max-h-[60vh] object-contain"
                  controls={false}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={preview}
                  alt="Aperçu"
                  className="max-w-full max-h-[60vh] object-contain"
                />
              )}
              <button
                onClick={goToEdit}
                className="absolute top-3 right-3 rounded-full bg-black/50 p-2.5 text-white hover:bg-black/70 transition-colors"
                aria-label="Modifier le média"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-xs font-bold text-[var(--os-muted)] mb-1.5">
                Légende
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                maxLength={160}
                className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-3.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500 resize-none"
                placeholder="Décris ce moment..."
              />
              <p className="text-[10px] text-[var(--os-muted)] text-right mt-1">{caption.length}/160</p>
            </div>

            {/* City + Visibility row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-[var(--os-muted)] mb-1.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Ville
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Paris, Lyon..."
                  className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-3.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-[var(--os-muted)] mb-1.5">
                  Visibilité
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-3.5 text-sm text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="FRIENDS">Amis uniquement</option>
                  <option value="PLAN_PARTICIPANTS">Participants du plan</option>
                  <option value="PRIVATE">Privé</option>
                </select>
              </div>
            </div>

            {/* Audio */}
            <div>
              <label className="block text-xs font-bold text-[var(--os-muted)] mb-1.5">
                Musique
              </label>
              {!audioTrack ? (
                <button
                  onClick={() => setPickerOpen(true)}
                  className="w-full flex items-center gap-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-3.5 py-3 text-left hover:bg-[var(--os-card-hover)] transition-colors active:scale-[0.98]"
                >
                  <div className="rounded-full bg-outside-500/10 p-2.5">
                    <Music className="h-4 w-4 text-outside-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--os-fg)]">
                      {isOriginalAudio ? "Son original" : "Ajouter une musique"}
                    </p>
                    <p className="text-[11px] text-[var(--os-muted)]">
                      {isOriginalAudio
                        ? "L'audio de la vidéo sera conservé"
                        : "Choisir un son de la bibliothèque"}
                    </p>
                  </div>
                  <span className="ml-auto text-xs text-[var(--os-muted)]">Choisir</span>
                </button>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-outside-500/20 bg-outside-500/5 px-3.5 py-3">
                  <div className="rounded-full bg-outside-500/10 p-2.5">
                    <Music className="h-4 w-4 text-outside-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--os-fg)] truncate">{audioTrack.title}</p>
                    <p className="text-[11px] text-[var(--os-muted)] truncate">
                      {audioTrack.artistName || "Artiste inconnu"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={audioVolume}
                      onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                      className="w-16 accent-outside-500"
                      aria-label="Volume"
                    />
                    <span className="text-[10px] text-[var(--os-muted)] w-6 text-right">{Math.round(audioVolume * 100)}%</span>
                  </div>
                  <button
                    onClick={() => { setAudioTrack(null); setIsOriginalAudio(false); }}
                    className="rounded-full p-1.5 text-[var(--os-muted)] hover:bg-red-50 hover:text-red-500 transition-colors"
                    aria-label="Retirer la musique"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Privacy notice */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2 dark:border-amber-900 dark:bg-amber-950/20">
              <MapPin className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Ta position exacte ne sera jamais affichée. Seule la ville sera visible.
              </p>
            </div>

            {/* Submit buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={goToEdit}
                className="flex-1 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] py-3.5 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors active:scale-[0.98]"
              >
                Modifier le média
              </button>
              <button
                onClick={submit}
                disabled={loading || !city.trim()}
                className="flex-1 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 py-3.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Upload className="h-4 w-4" />
                Publier
              </button>
            </div>
          </div>
        )}

        {/* Step: Publishing */}
        {step === "publish" && (
          <div className="flex flex-col items-center justify-center py-20 px-4 animate-fade-in">
            {uploadState?.status === "completed" ? (
              <div className="text-center space-y-5">
                <div className="h-24 w-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-12 w-12 text-green-400" />
                </div>
                <p className="text-xl font-black text-[var(--os-fg)]">Moment publié !</p>
                <p className="text-sm text-[var(--os-muted)]">Redirection vers le fil d&apos;actualité...</p>
              </div>
            ) : uploadState?.status === "error" ? (
              <div className="text-center space-y-5">
                <div className="h-24 w-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                  <AlertCircle className="h-12 w-12 text-red-400" />
                </div>
                <p className="text-xl font-black text-[var(--os-fg)]">Erreur</p>
                <p className="text-sm text-[var(--os-muted)] max-w-xs">
                  {uploadState.message || "Une erreur est survenue lors de la publication."}
                </p>
                <button
                  onClick={() => setStep("details")}
                  className="rounded-xl bg-[var(--os-card)] border border-[var(--os-card-border)] px-6 py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
                >
                  Réessayer
                </button>
              </div>
            ) : (
              <div className="w-full max-w-sm space-y-6">
                <UploadProgressComponent
                  progress={{
                    status: uploadState?.status === "init" || uploadState?.status === "creating" ? "uploading" : uploadState?.status || "preparing",
                    percentage: uploadState?.percentage || 0,
                    message: uploadState?.message,
                  }}
                  onCancel={() => {
                    setLoading(false);
                    setUploadState(null);
                    setStep("details");
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Editing overlays */}
        <AudioPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(track, opts) => {
            if (opts?.isOriginal) {
              setIsOriginalAudio(true);
              setAudioTrack(null);
            } else if (track) {
              setAudioTrack(track);
              setIsOriginalAudio(false);
            } else {
              setAudioTrack(null);
              setIsOriginalAudio(false);
            }
          }}
          selectedTrackId={audioTrack?.id ?? (isOriginalAudio ? null : undefined)}
        />
      </AnimatedPage>

      {showImageEditor && file && (
        <ImageCropEditor
          imageFile={file}
          onConfirm={handleImageCropConfirm}
          onCancel={handleImageEditCancel}
        />
      )}

      {showVideoEditor && file && (
        <VideoTrimEditor
          videoFile={file}
          onConfirm={handleVideoTrimConfirm}
          onCancel={handleVideoEditCancel}
          maxDuration={60}
        />
      )}
    </div>
  );
}
