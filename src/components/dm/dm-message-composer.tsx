"use client";

import { useRef, useState, useEffect } from "react";
import { Camera, ImageIcon, Mic, Plus, SendHorizontal, X, Paperclip, Share2, UserRound, Square, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useDictionary } from "@/hooks/use-dictionary";
import { compressImage, shouldCompressImage } from "@/lib/media/compress-image";
import { retryAsync, UploadProgress } from "@/lib/upload/retry-upload";
import { UploadProgressComponent } from "@/components/upload/upload-progress";

const MAX_RECORDING_SECONDS = 180;

interface DmMessageComposerProps {
  onSend: (
    _text: string,
    _opts?: {
      type?: string;
      mediaUrl?: string;
      mediaPath?: string;
      mediaName?: string;
      mediaMimeType?: string;
      mediaSize?: number;
      momentId?: string;
      metadata?: Record<string, unknown>;
    }
  ) => void;
  sending?: boolean;
  conversationId: string;
  onOpenPlanSelector?: () => void;
  onOpenMomentSelector?: () => void;
  onShareProfile?: () => void;
}

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function DmMessageComposer({
  onSend, sending, conversationId,
  onOpenPlanSelector, onOpenMomentSelector, onShareProfile,
}: DmMessageComposerProps) {
  const [text, setText] = useState("");
  const [showPlus, setShowPlus] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "recorded">("idle");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [micSupported, setMicSupported] = useState(true);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const audioPickerRef = useRef<HTMLInputElement>(null);
  const plusRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addToast } = useToast();
  const t = useDictionary();

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicSupported(false);
    }
  }, []);

  // Close plus menu on outside click
  useEffect(() => {
    if (!showPlus) return;
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (plusRef.current && !plusRef.current.contains(e.target as Node)) {
        setShowPlus(false);
      }
    };
    const timer = setTimeout(() => document.addEventListener("click", handleClick), 0);
    document.addEventListener("touchstart", handleClick);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [showPlus]);

  // Cleanup media on unmount
  useEffect(() => {
    return () => {
      stopMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopMedia() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (recordedUrl) { URL.revokeObjectURL(recordedUrl); }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        setRecordingState("recorded");
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };

      recorder.start(250);
      setRecordingState("recording");
      setRecordingDuration(0);
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(elapsed);
        if (elapsed >= MAX_RECORDING_SECONDS && recorder.state === "recording") {
          recorder.stop();
        }
      }, 200);
    } catch {
      setMicSupported(false);
      addToast("Microphone non accessible. Utilise le sélecteur de fichier audio.", "error");
      audioPickerRef.current?.click();
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function cancelRecording() {
    stopMedia();
    setRecordingState("idle");
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingDuration(0);
  }

  async function sendRecording() {
    if (!recordedBlob) return;
    const file = new File([recordedBlob], `voice-${Date.now()}.webm`, { type: recordedBlob.type });
    setRecordingState("idle");
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingDuration(0);

    setUploadProgress({ status: "uploading", percentage: 30, message: "Envoi audio..." });
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversationId", conversationId);
      const res = await fetch("/api/dm/media", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'upload");
      setUploadProgress({ status: "completed", percentage: 100 });
      onSend("", {
        type: "AUDIO",
        mediaUrl: data.mediaUrl,
        mediaPath: data.path,
        mediaName: data.mediaName,
        mediaMimeType: data.mediaMimeType,
        mediaSize: data.mediaSize,
      });
      setTimeout(() => setUploadProgress(null), 500);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Impossible d'envoyer l'audio.", "error");
      setUploadProgress({ status: "error", percentage: 0, message: err instanceof Error ? err.message : "Erreur" });
      setTimeout(() => setUploadProgress(null), 2000);
    }
  }

  function handleSubmit() {
    const t = text.trim();
    if (!t || sending) return;
    onSend(t);
    setText("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    setText(el.value);
  }

  async function uploadFile(file: File) {
    let fileToUpload = file;
    if (shouldCompressImage(file)) {
      try {
        const result = await compressImage(file);
        fileToUpload = result.compressedFile;
        addToast(`Image compressée: ${(result.compressionRatio * 100).toFixed(0)}% de la taille originale`, "info");
      } catch (compressError) {
        console.error("Compression error:", compressError);
        addToast("Compression échouée, envoi de l'original", "info");
        fileToUpload = file;
      }
    }

    const uploadWithRetry = async () => {
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("conversationId", conversationId);
      const res = await fetch("/api/dm/media", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec de l'upload");
      return json as {
        mediaUrl: string;
        type: string;
        path: string;
        mediaName: string;
        mediaMimeType: string;
        mediaSize: number;
      };
    };

    return retryAsync(uploadWithRetry, {
      maxAttempts: 3,
      baseDelay: 1000,
      onRetry: (attempt) => {
        addToast(`Échec de l'envoi. Nouvelle tentative (${attempt}/3)...`, "info");
      },
    });
  }

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
  const MAX_AUDIO_SIZE = 10 * 1024 * 1024;

  function checkFileSize(file: File, maxSize: number, label: string): boolean {
    if (file.size <= maxSize) return true;
    addToast(`Fichier ${label} max ${maxSize / (1024 * 1024)} Mo.`, "error");
    return false;
  }

  async function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    if (!checkFileSize(file, isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE, isVideo ? "vidéo" : "photo")) {
      if (galleryRef.current) galleryRef.current.value = "";
      return;
    }
    setUploadProgress({ status: "preparing", percentage: 0 });
    try {
      if (!isVideo && shouldCompressImage(file)) {
        setUploadProgress({ status: "compressing", percentage: 10, message: "Compression..." });
      }
      setUploadProgress({ status: "uploading", percentage: 30, message: "Envoi..." });
      const data = await uploadFile(file);
      setUploadProgress({ status: "completed", percentage: 100 });
      onSend("", {
        type: data.type,
        mediaUrl: data.mediaUrl,
        mediaPath: data.path,
        mediaName: data.mediaName,
        mediaMimeType: data.mediaMimeType,
        mediaSize: data.mediaSize,
      });
      setTimeout(() => setUploadProgress(null), 500);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Impossible d'envoyer le média.", "error");
      setUploadProgress({ status: "error", percentage: 0, message: err instanceof Error ? err.message : "Erreur" });
      setTimeout(() => setUploadProgress(null), 2000);
    } finally {
      if (galleryRef.current) galleryRef.current.value = "";
    }
  }

  async function handleCameraChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!checkFileSize(file, MAX_IMAGE_SIZE, "photo")) {
      if (cameraRef.current) cameraRef.current.value = "";
      return;
    }
    setUploadProgress({ status: "preparing", percentage: 0 });
    try {
      if (shouldCompressImage(file)) {
        setUploadProgress({ status: "compressing", percentage: 10, message: "Compression..." });
      }
      setUploadProgress({ status: "uploading", percentage: 30, message: "Envoi..." });
      const data = await uploadFile(file);
      setUploadProgress({ status: "completed", percentage: 100 });
      onSend("", {
        type: data.type,
        mediaUrl: data.mediaUrl,
        mediaPath: data.path,
        mediaName: data.mediaName,
        mediaMimeType: data.mediaMimeType,
        mediaSize: data.mediaSize,
      });
      setTimeout(() => setUploadProgress(null), 500);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Impossible d'envoyer la capture.", "error");
      setUploadProgress({ status: "error", percentage: 0, message: err instanceof Error ? err.message : "Erreur" });
      setTimeout(() => setUploadProgress(null), 2000);
    } finally {
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

  async function handleAudioPickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!checkFileSize(file, MAX_AUDIO_SIZE, "audio")) {
      if (audioPickerRef.current) audioPickerRef.current.value = "";
      return;
    }
    setUploadProgress({ status: "preparing", percentage: 0 });
    try {
      setUploadProgress({ status: "uploading", percentage: 30, message: "Envoi..." });
      const data = await uploadFile(file);
      setUploadProgress({ status: "completed", percentage: 100 });
      onSend("", {
        type: "AUDIO",
        mediaUrl: data.mediaUrl,
        mediaPath: data.path,
        mediaName: data.mediaName,
        mediaMimeType: data.mediaMimeType,
        mediaSize: data.mediaSize,
      });
      setTimeout(() => setUploadProgress(null), 500);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Impossible d'envoyer l'audio.", "error");
      setUploadProgress({ status: "error", percentage: 0, message: err instanceof Error ? err.message : "Erreur" });
      setTimeout(() => setUploadProgress(null), 2000);
    } finally {
      if (audioPickerRef.current) audioPickerRef.current.value = "";
    }
  }

  function handlePlusAction(action: string) {
    setShowPlus(false);
    if (action === "photo") {
      galleryRef.current?.click();
    } else if (action === "camera") {
      cameraRef.current?.click();
    } else if (action === "audio") {
      if (micSupported) {
        startRecording();
      } else {
        audioPickerRef.current?.click();
      }
    } else if (action === "plan") {
      onOpenPlanSelector?.();
    } else if (action === "moment") {
      onOpenMomentSelector?.();
    } else if (action === "profile") {
      onShareProfile?.();
    }
  }

  return (
    <div className="shrink-0 border-t border-[var(--os-card-border)] bg-[var(--os-bg)]/95 backdrop-blur-md px-3 py-2.5">
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        {/* Left actions */}
        <div className="flex items-center gap-0.5 shrink-0 pb-0.5">
          <button
            onClick={() => cameraRef.current?.click()}
            className="rounded-full p-2 text-[var(--os-muted)] hover:bg-[var(--os-card-border)] hover:text-[var(--os-fg)] transition-colors"
            aria-label="Caméra"
          >
            <Camera className="h-5 w-5" />
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className="rounded-full p-2 text-[var(--os-muted)] hover:bg-[var(--os-card-border)] hover:text-[var(--os-fg)] transition-colors"
            aria-label="Galerie"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Input or Recording UI */}
        <div className="flex-1 min-w-0">
          {recordingState === "recording" ? (
            <div className="flex items-center gap-3 rounded-2xl border border-red-300 bg-red-50 px-3.5 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-bold text-red-600 tabular-nums">{formatTimer(recordingDuration)}</span>
              <div className="flex-1 h-1 bg-red-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${(recordingDuration / MAX_RECORDING_SECONDS) * 100}%` }}
                />
              </div>
              <button
                onClick={stopRecording}
                className="rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 transition-colors"
                aria-label="Arrêter"
              >
                <Square className="h-4 w-4" />
              </button>
            </div>
          ) : recordingState === "recorded" && recordedUrl ? (
            <div className="flex items-center gap-2 rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-3.5 py-2">
              <audio controls className="h-8 flex-1 min-w-0" src={recordedUrl} />
              <button
                onClick={sendRecording}
                className="rounded-full bg-gradient-to-r from-outside-500 to-accent-500 p-1.5 text-white shadow-glow hover:shadow-glow-lg transition-all"
                aria-label={t.plans.send}
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
              <button
                onClick={cancelRecording}
                className="rounded-full p-1.5 text-[var(--os-muted)] hover:text-red-500 hover:bg-[var(--os-card-border)] transition-colors"
                aria-label="Annuler"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <textarea
              ref={inputRef}
              value={text}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Votre message..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-3.5 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:border-outside-400 focus:outline-none focus:ring-2 focus:ring-outside-400/20 transition-all max-h-[120px]"
            />
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-0.5 shrink-0 pb-0.5">
          {recordingState === "idle" && !text.trim() ? (
            <>
              <button
                onClick={() => {
                  if (micSupported) {
                    startRecording();
                  } else {
                    audioPickerRef.current?.click();
                  }
                }}
                className="rounded-full p-2 text-[var(--os-muted)] hover:bg-[var(--os-card-border)] hover:text-[var(--os-fg)] transition-colors"
                aria-label="Micro"
              >
                <Mic className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowPlus((s) => !s)}
                className="rounded-full p-2 text-[var(--os-muted)] hover:bg-[var(--os-card-border)] hover:text-[var(--os-fg)] transition-colors"
                aria-label="Plus"
              >
                {showPlus ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </button>
            </>
          ) : recordingState === "idle" ? (
            <button
              onClick={handleSubmit}
              disabled={sending}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-outside-500 to-accent-500 p-2.5 text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-60"
              aria-label={t.plans.send}
            >
              <SendHorizontal className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleGalleryChange}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraChange}
      />
      <input
        ref={audioPickerRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleAudioPickerChange}
      />

      {/* Upload Progress */}
      {uploadProgress && (
        <div className="max-w-2xl mx-auto">
          <UploadProgressComponent progress={uploadProgress} compact />
        </div>
      )}

      {/* Plus menu */}
      {showPlus && (
        <div ref={plusRef} className="mt-2 grid grid-cols-3 gap-2 max-w-2xl mx-auto">
          {[
            { key: "photo", label: "Photo", icon: ImageIcon },
            { key: "camera", label: "Caméra", icon: Camera },
            { key: "audio", label: "Audio", icon: Mic },
            { key: "plan", label: "Inviter", icon: Paperclip },
            { key: "moment", label: "Moment", icon: Share2 },
            { key: "profile", label: "Profil", icon: UserRound },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => handlePlusAction(opt.key)}
              className="flex flex-col items-center gap-1 rounded-xl bg-[var(--os-card)] border border-[var(--os-card-border)] p-3 text-xs font-semibold text-[var(--os-fg)] hover:bg-[var(--os-card-border)] transition-colors"
            >
              <opt.icon className="h-5 w-5 text-[var(--os-muted)]" />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
