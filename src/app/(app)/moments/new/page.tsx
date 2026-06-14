"use client";

import dynamic from "next/dynamic";
import { useState, useRef, ChangeEvent, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { AnimatedPage } from "@/components/ui/animated-page";
import { useMomentDraft } from "@/hooks/use-moment-draft";
import {
  Image as ImageIcon, Upload, MapPin, ArrowLeft,
  Save, Volume2, Music, Trash2, Eye, FileImage,
  CheckCircle2, AlertCircle, Camera, Film,
} from "lucide-react";
import { AUDIO_RIGHTS_NOTICE } from "@/lib/audio";
import { compressImage, shouldCompressImage } from "@/lib/media/compress-image";
import { retryAsync, UploadProgress } from "@/lib/upload/retry-upload";

const AudioPicker = dynamic(() => import("@/components/audio/audio-picker").then((m) => ({ default: m.AudioPicker })), { ssr: false });
const ImageCropEditor = dynamic(() => import("@/components/media/image-crop-editor").then((m) => ({ default: m.ImageCropEditor })), { ssr: false });
const VideoTrimEditor = dynamic(() => import("@/components/media/video-trim-editor").then((m) => ({ default: m.VideoTrimEditor })), { ssr: false });
const UploadProgressComponent = dynamic(() => import("@/components/upload/upload-progress").then((m) => ({ default: m.UploadProgressComponent })), { ssr: false });
const MomentPreview = dynamic(() => import("@/components/moments/moment-preview").then((m) => ({ default: m.MomentPreview })), { ssr: false });

type Step = "select" | "edit" | "preview" | "publish";

export default function NewMomentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("select");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isVerticalVideo, setIsVerticalVideo] = useState(false);
  const [publishAsClip, setPublishAsClip] = useState(false);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [audioTrack, setAudioTrack] = useState<{ id: string; title: string; artistName: string | null } | null>(null);
  const [audioVolume, setAudioVolume] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isOriginalAudio, setIsOriginalAudio] = useState(false);
  const [user, setUser] = useState<{ name: string | null; image: string | null; username: string | null } | null>(null);
  const [mediaType, setMediaType] = useState<"PHOTO" | "VIDEO">("PHOTO");
  const [processedVideoMeta, setProcessedVideoMeta] = useState<{
    startTime: number;
    endTime: number;
    duration: number;
    width: number;
    height: number;
  } | null>(null);

  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [mediaMetadata, setMediaMetadata] = useState<{
    mediaWidth?: number;
    mediaHeight?: number;
    mediaDuration?: number;
    mediaCrop?: Record<string, unknown>;
    videoStartTime?: number;
    videoEndTime?: number;
    mediaAspectRatio?: string;
  }>({});

  const { data: session } = useSession();
  const draft = useMomentDraft(session?.user?.id);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user;
        if (u) {
          setUser({ name: u.name, image: u.image, username: u.username });
        }
        const fallbackCity = u?.activeCity?.name || u?.homeCity?.name || "";
        const existing = draft.restoreDraft();
        if (existing) {
          setShowDraftPrompt(true);
          setCity(existing.city || fallbackCity);
          setCaption(existing.caption || "");
          setVisibility(existing.visibility || "PUBLIC");
          setPublishAsClip(existing.publishAsClip || false);
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
    if (caption || city || visibility !== "PUBLIC" || publishAsClip) {
      draft.saveDraft({ caption, visibility, city, publishAsClip });
    }
  }, [caption, visibility, city, publishAsClip, draft]);

  const resetMedia = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setIsVerticalVideo(false);
    setPublishAsClip(false);
    setMediaMetadata({});
    setProcessedVideoMeta(null);
    setMediaType("PHOTO");
    setStep("select");
  }, [preview]);

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
        v.src = url;
        v.onloadedmetadata = () => {
          const vertical = v.videoHeight > v.videoWidth;
          setIsVerticalVideo(vertical);
          setPublishAsClip(vertical);
          setShowVideoEditor(true);
          setStep("edit");
        };
      } catch {
        setIsVerticalVideo(false);
        setPublishAsClip(false);
        setShowVideoEditor(true);
        setStep("edit");
      }
    } else {
      setMediaType("PHOTO");
      setIsVerticalVideo(false);
      setPublishAsClip(false);
      setShowImageEditor(true);
      setStep("edit");
    }
  }

  const handleImageCropConfirm = (croppedFile: File) => {
    setFile(croppedFile);
    const url = URL.createObjectURL(croppedFile);
    setPreview(url);
    setShowImageEditor(false);
    const img = new Image();
    img.onload = () => {
      setMediaMetadata({
        ...mediaMetadata,
        mediaWidth: img.width,
        mediaHeight: img.height,
        mediaAspectRatio: `${img.width}:${img.height}`,
      });
    };
    img.src = url;
    setStep("preview");
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
    const url = URL.createObjectURL(result.processedFile);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(url);
    setProcessedVideoMeta({
      startTime: result.startTime,
      endTime: result.endTime,
      duration: result.duration,
      width: result.width,
      height: result.height,
    });
    setMediaMetadata({
      ...mediaMetadata,
      videoStartTime: result.startTime,
      videoEndTime: result.endTime,
      mediaDuration: result.duration,
      mediaWidth: result.width,
      mediaHeight: result.height,
      mediaAspectRatio: `${result.width}:${result.height}`,
    });
    setShowVideoEditor(false);
    setStep("preview");
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

  async function submit() {
    if (!file) return;

    const hasContext = city.trim();
    if (!hasContext) {
      addToast("Un moment doit être lié à une ville.", "error");
      return;
    }

    setLoading(true);
    setStep("publish");
    setUploadProgress({ status: "preparing", percentage: 0 });

    try {
      let fileToUpload = file;
      if (shouldCompressImage(file) && mediaType === "PHOTO") {
        setUploadProgress({ status: "compressing", percentage: 10, message: "Compression de l'image..." });
        try {
          const result = await compressImage(file);
          fileToUpload = result.compressedFile;
        } catch {
          fileToUpload = file;
        }
      }

      setUploadProgress({ status: "uploading", percentage: 30, message: "Envoi en cours..." });

      const uploadWithProgress = async () => {
        const formData = new FormData();
        formData.append("file", fileToUpload);
        if (caption.trim()) formData.append("caption", caption.trim());
        formData.append("visibility", visibility);
        if (city.trim()) formData.append("city", city.trim());
        if (audioTrack) {
          formData.append("audioTrackId", audioTrack.id);
          formData.append("audioStartTime", "0");
          formData.append("audioVolume", String(audioVolume));
        }
        if (mediaMetadata.mediaWidth) formData.append("mediaWidth", String(mediaMetadata.mediaWidth));
        if (mediaMetadata.mediaHeight) formData.append("mediaHeight", String(mediaMetadata.mediaHeight));
        if (mediaMetadata.mediaDuration) formData.append("mediaDuration", String(mediaMetadata.mediaDuration));
        if (mediaMetadata.mediaCrop) formData.append("mediaCrop", JSON.stringify(mediaMetadata.mediaCrop));
        if (mediaMetadata.videoStartTime) formData.append("videoStartTime", String(mediaMetadata.videoStartTime));
        if (mediaMetadata.videoEndTime) formData.append("videoEndTime", String(mediaMetadata.videoEndTime));
        if (mediaMetadata.mediaAspectRatio) formData.append("mediaAspectRatio", mediaMetadata.mediaAspectRatio);

        const res = await fetch("/api/moments", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Erreur lors de la publication");
        }
        return res;
      };

      await retryAsync(uploadWithProgress, {
        maxAttempts: 3,
        baseDelay: 1000,
        onRetry: (attempt) => {
          addToast(`Échec de l'envoi. Nouvelle tentative (${attempt}/3)...`, "info");
          setUploadProgress({
            status: "uploading",
            percentage: 30 + attempt * 10,
            message: `Nouvelle tentative ${attempt}/3...`,
          });
        },
      });

      setUploadProgress({ status: "processing", percentage: 90, message: "Traitement..." });

      draft.clearDraft();
      setUploadProgress({ status: "completed", percentage: 100 });
      addToast("Moment publié !", "success");

      setTimeout(() => {
        router.push("/moments");
        router.refresh();
      }, 800);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur réseau";
      addToast(errorMessage, "error");
      setUploadProgress({ status: "error", percentage: 0, message: errorMessage });
      setLoading(false);
    }
  }

  const steps = [
    { key: "select", label: "Sélection", icon: FileImage },
    { key: "edit", label: "Édition", icon: Camera },
    { key: "preview", label: "Aperçu", icon: Eye },
    { key: "publish", label: "Publication", icon: Upload },
  ] as const;

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <AnimatedPage className="p-4 max-w-xl mx-auto space-y-6 pb-24 md:pb-4">
      <div className="flex items-center justify-between">
        <Link
          href="/moments"
          className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        {step !== "select" && step !== "publish" && (
          <button
            onClick={() => {
              if (step === "preview") {
                setShowVideoEditor(true);
                setStep("edit");
              } else if (step === "edit") {
                resetMedia();
              }
            }}
            className="text-xs font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
          >
            Modifier
          </button>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-black text-[var(--os-fg)] flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          {step === "select" && "Nouveau moment"}
          {step === "edit" && "Éditer le média"}
          {step === "preview" && "Aperçu"}
          {step === "publish" && "Publication"}
        </h1>
      </div>

      <div className="flex items-center gap-1.5">
        {steps.map((s, i) => {
          const isActive = i === currentStepIndex;
          const isDone = i < currentStepIndex;
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-center gap-1.5 flex-1">
              <div
                className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold transition-all ${
                  isActive
                    ? "bg-outside-500 text-white shadow-glow"
                    : isDone
                    ? "bg-green-500/20 text-green-400"
                    : "bg-[var(--os-card)] text-[var(--os-muted)]"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-px flex-1 ${
                    i < currentStepIndex ? "bg-green-500/50" : "bg-[var(--os-card-border)]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {showDraftPrompt && step === "select" && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 space-y-3 dark:border-sky-900 dark:bg-sky-950/20">
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
                setPublishAsClip(false);
                setCity("");
              }}
              className="rounded-lg border border-sky-300 px-4 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100 transition-colors dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-900/30"
            >
              Supprimer
            </button>
          </div>
        </div>
      )}

      {draft.draft && !showDraftPrompt && !file && step === "select" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2 dark:border-amber-900 dark:bg-amber-950/20">
          <MapPin className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Ajoute à nouveau ton média pour publier ce brouillon.
          </p>
        </div>
      )}

      {draft.savedAt && !showDraftPrompt && step === "select" && (
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--os-muted)] animate-fade-in">
          <Save className="h-3 w-3" />
          <span>Brouillon enregistré</span>
        </div>
      )}

      {step === "select" && !file && (
        <>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-[var(--os-card-border)] bg-[var(--os-bg)] p-16 cursor-pointer hover:border-outside-300 transition-colors group"
          >
            <div className="rounded-2xl bg-gradient-to-br from-outside-500/10 to-accent-500/10 p-5 group-hover:scale-110 transition-transform">
              <Camera className="h-10 w-10 text-outside-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-[var(--os-fg)]">
                Ajoute une photo ou une vidéo
              </p>
              <p className="text-sm text-[var(--os-muted)] mt-1">
                Photo max 5 Mo · Vidéo max 50 Mo
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <div className="flex items-center gap-1.5 rounded-full bg-outside-500/10 px-3 py-1.5 text-[11px] font-bold text-outside-400">
                <ImageIcon className="h-3.5 w-3.5" />
                JPG · PNG · WebP
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3 py-1.5 text-[11px] font-bold text-accent-400">
                <Film className="h-3.5 w-3.5" />
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
        </>
      )}

      {step === "preview" && file && preview && user && (
        <div className="space-y-4 animate-fade-in">
          <MomentPreview
            mediaUrl={preview}
            type={mediaType}
            caption={caption}
            city={city}
            visibility={visibility}
            author={user}
            videoStartTime={mediaMetadata.videoStartTime}
            videoEndTime={mediaMetadata.videoEndTime}
          />

          <div className="rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--os-muted)] mb-1">Légende</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                maxLength={160}
                className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-3 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500 resize-none"
                placeholder="Décris ce moment..."
              />
              <p className="text-[10px] text-[var(--os-muted)] text-right">{caption.length}/160</p>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-[var(--os-muted)] mb-1">Visibilité</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-3 text-sm text-[var(--os-fg)] focus:outline-none focus:ring-2 focus:ring-outside-500"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="FRIENDS">Amis uniquement</option>
                  <option value="PLAN_PARTICIPANTS">Participants du plan</option>
                  <option value="PRIVATE">Privé</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-[var(--os-muted)] mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Ville
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Paris, Lyon..."
                  className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-3 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
                />
              </div>
            </div>

            {file?.type.startsWith("video/") && (
              <div className="flex items-center justify-between rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-3">
                <div>
                  <p className="text-sm font-bold text-[var(--os-fg)]">Publier comme clip</p>
                  <p className="text-xs text-[var(--os-muted)]">
                    {isVerticalVideo ? "Vidéo verticale" : "Vidéo classique"}
                    {processedVideoMeta && ` · ${processedVideoMeta.duration}s · ${processedVideoMeta.width}x${processedVideoMeta.height}`}
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={publishAsClip}
                    onChange={(e) => setPublishAsClip(e.target.checked)}
                    className="h-4 w-4 accent-outside-500"
                  />
                </label>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
              <Volume2 className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">{AUDIO_RIGHTS_NOTICE}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--os-muted)] mb-1">Musique</label>
              {!audioTrack ? (
                <button
                  onClick={() => setPickerOpen(true)}
                  className="w-full flex items-center gap-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] px-3 py-3 text-left hover:bg-[var(--os-card)] transition-colors active:scale-[0.98]"
                >
                  <div className="rounded-full bg-outside-500/10 p-2">
                    <Music className="h-4 w-4 text-outside-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--os-fg)]">
                      {isOriginalAudio ? "Son original" : "Ajouter une musique"}
                    </p>
                    <p className="text-[11px] text-[var(--os-muted)]">
                      {isOriginalAudio
                        ? "L'audio de la vidéo sera conservé"
                        : "Choisir un son de la bibliothèque ou importer le tien"}
                    </p>
                  </div>
                  <span className="ml-auto text-[11px] text-[var(--os-muted)]">Choisir</span>
                </button>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-outside-500/20 bg-outside-500/5 px-3 py-3">
                  <div className="rounded-full bg-outside-500/10 p-2">
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

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 dark:border-amber-900 dark:bg-amber-950/20">
              <MapPin className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Ta position exacte ne sera jamais affichée.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowVideoEditor(true);
                setStep("edit");
              }}
              className="flex-1 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors active:scale-[0.98]"
            >
              Modifier le média
            </button>
            <button
              onClick={submit}
              disabled={loading || !city.trim()}
              className="flex-1 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Upload className="h-4 w-4" />
              Publier
            </button>
          </div>
        </div>
      )}

      {step === "publish" && (
        <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
          {uploadProgress?.status === "completed" ? (
            <div className="text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
              <p className="text-lg font-black text-[var(--os-fg)]">Moment publié !</p>
              <p className="text-sm text-[var(--os-muted)]">Redirection vers le fil d&apos;actualité...</p>
              <div className="h-1 w-48 bg-[var(--os-card-border)] rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-gradient-to-r from-outside-500 to-accent-500 animate-pulse rounded-full" style={{ width: "60%" }} />
              </div>
            </div>
          ) : uploadProgress?.status === "error" ? (
            <div className="text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                <AlertCircle className="h-10 w-10 text-red-400" />
              </div>
              <p className="text-lg font-black text-[var(--os-fg)]">Erreur</p>
              <p className="text-sm text-[var(--os-muted)] max-w-xs">
                {uploadProgress.message || "Une erreur est survenue lors de la publication."}
              </p>
              <button
                onClick={() => setStep("preview")}
                className="rounded-xl bg-[var(--os-card)] border border-[var(--os-card-border)] px-6 py-3 text-sm font-bold text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <div className="w-full max-w-sm space-y-4">
              <UploadProgressComponent
                progress={uploadProgress || { status: "preparing", percentage: 0 }}
                onCancel={() => {
                  setLoading(false);
                  setUploadProgress(null);
                  setStep("preview");
                }}
              />
            </div>
          )}
        </div>
      )}

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
    </AnimatedPage>
  );
}
