"use client";

import { useRef, useState } from "react";
import { Camera, ImageIcon, Mic, Plus, SendHorizontal, X, Paperclip } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface DmMessageComposerProps {
  onSend: (text: string, opts?: { type?: string; mediaUrl?: string; momentId?: string; metadata?: Record<string, unknown> }) => void;
  sending?: boolean;
  conversationId: string;
}

export function DmMessageComposer({ onSend, sending, conversationId }: DmMessageComposerProps) {
  const [text, setText] = useState("");
  const [showPlus, setShowPlus] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

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
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversationId", conversationId);
    const res = await fetch("/api/dm/media", { method: "POST", body: formData });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Échec de l'upload");
    return json as { mediaUrl: string; type: string };
  }

  async function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { mediaUrl, type } = await uploadFile(file);
      onSend("", { type, mediaUrl });
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Impossible d'envoyer le média.", "error");
    } finally {
      if (galleryRef.current) galleryRef.current.value = "";
    }
  }

  async function handleCameraChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { mediaUrl, type } = await uploadFile(file);
      onSend("", { type, mediaUrl });
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Impossible d'envoyer la capture.", "error");
    } finally {
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

  async function handleAudioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { mediaUrl } = await uploadFile(file);
      onSend("", { type: "AUDIO", mediaUrl });
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Impossible d'envoyer l'audio.", "error");
    } finally {
      if (audioRef.current) audioRef.current.value = "";
    }
  }

  function handlePlusAction(action: string) {
    setShowPlus(false);
    if (action === "photo") {
      galleryRef.current?.click();
    } else if (action === "camera") {
      cameraRef.current?.click();
    } else if (action === "audio") {
      audioRef.current?.click();
    } else if (action === "plan" || action === "profile" || action === "moment") {
      addToast("Bientôt disponible.", "info");
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

        {/* Input */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Votre message..."
            rows={1}
            className="w-full resize-none rounded-2xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-3.5 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:border-outside-400 focus:outline-none focus:ring-2 focus:ring-outside-400/20 transition-all max-h-[120px]"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-0.5 shrink-0 pb-0.5">
          {!text.trim() ? (
            <>
              <button
                onClick={() => audioRef.current?.click()}
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
          ) : (
            <button
              onClick={handleSubmit}
              disabled={sending}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-outside-500 to-accent-500 p-2.5 text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-60"
              aria-label="Envoyer"
            >
              <SendHorizontal className="h-5 w-5" />
            </button>
          )}
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
        ref={audioRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleAudioChange}
      />

      {/* Plus menu */}
      {showPlus && (
        <div className="mt-2 grid grid-cols-3 gap-2 max-w-2xl mx-auto">
          {[
            { key: "photo", label: "Photo", icon: ImageIcon },
            { key: "camera", label: "Caméra", icon: Camera },
            { key: "audio", label: "Audio", icon: Mic },
            { key: "plan", label: "Inviter", icon: Paperclip },
            { key: "profile", label: "Profil", icon: Paperclip },
            { key: "moment", label: "Moment", icon: Paperclip },
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
