"use client";

import { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";
import { useToast } from "@/components/ui/toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { X, Image as ImageIcon, Video, Upload, MapPin } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";
import { ALLOWED_MOMENT_TYPES, MOMENT_PHOTO_MAX_SIZE, MOMENT_VIDEO_MAX_SIZE, ACCEPT_MEDIA_TYPES } from "@/lib/supabase/moments-storage";

interface Props {
  open: boolean;
  onClose: () => void;
  onUploaded?: () => void;
  defaultCity?: string;
  defaultPlanId?: string;
  defaultPlaceId?: string;
}

export function MomentUploadSheet({ open, onClose, onUploaded, defaultCity, defaultPlanId, defaultPlaceId }: Props) {
  const { addToast } = useToast();
  const haptic = useHaptic();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [videoPlayable, setVideoPlayable] = useState(true);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [city, setCity] = useState(defaultCity || "");
  const [loading, setLoading] = useState(false);
  const [planId, setPlanId] = useState(defaultPlanId || "");
  const [placeId, setPlaceId] = useState(defaultPlaceId || "");

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ALLOWED_MOMENT_TYPES.includes(selected.type)) {
      haptic.error();
      addToast("Format non accepté.", "error");
      return;
    }

    const maxSize = selected.type.startsWith("video/") ? MOMENT_VIDEO_MAX_SIZE : MOMENT_PHOTO_MAX_SIZE;
    if (selected.size > maxSize) {
      haptic.error();
      const label = selected.type.startsWith("video/") ? "100 Mo" : "10 Mo";
      addToast(`Fichier trop lourd. Taille max : ${label}.`, "error");
      return;
    }

    haptic.success();
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreview(url);
    if (selected.type.startsWith("video/")) {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => setVideoPlayable(true);
      v.onerror = () => setVideoPlayable(false);
      v.src = url;
    } else {
      setVideoPlayable(true);
    }
  }

  async function submit() {
    if (!file) return;

    const hasContext = city.trim() || planId || placeId;
    if (!hasContext) {
      haptic.error();
      addToast("Un moment doit être lié à une sortie, un lieu ou une ville.", "error");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (caption.trim()) formData.append("caption", caption.trim());
      formData.append("visibility", visibility);
      if (city.trim()) formData.append("city", city.trim());
      if (planId) formData.append("planId", planId);
      if (placeId) formData.append("placeId", placeId);

      const res = await fetch("/api/moments", { method: "POST", body: formData });
      if (res.ok) {
        haptic.success();
        addToast("Moment publié !", "success");
        onUploaded?.();
        onClose();
      } else {
        haptic.error();
        const data = await res.json().catch(() => ({}));
        addToast(data.error || "Erreur lors de la publication", "error");
      }
    } catch {
      haptic.error();
      addToast("Erreur réseau", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Ajouter un moment"
      footer={(
        <button
          onClick={submit}
          disabled={!file || loading}
          className="w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Upload className="h-4 w-4" />
          {loading ? "Publication..." : "Publier le moment"}
        </button>
      )}
    >
      <div className="space-y-4">
        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--os-card-border)] bg-[var(--os-bg)] p-10 cursor-pointer hover:border-outside-300 transition-colors active:scale-[0.98]"
          >
            <div className="flex gap-3">
              <ImageIcon className="h-8 w-8 text-[var(--os-muted)]" />
              <Video className="h-8 w-8 text-[var(--os-muted)]" />
            </div>
            <p className="text-sm text-[var(--os-muted)] text-center">
              Photo (max 5 Mo) ou vidéo (max 50 Mo)
            </p>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-black">
            {file.type.startsWith("video/") ? (
              videoPlayable ? (
                <video src={preview || undefined} className="w-full max-h-64 object-contain" controls />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 p-8 text-[var(--os-muted)]">
                  <Video className="h-10 w-10" />
                  <p className="text-sm text-center">Aperçu non disponible pour ce format vidéo</p>
                  <p className="text-xs text-center opacity-60">Le fichier sera tout de même publié</p>
                </div>
              )
            ) : (
              <Image src={preview || ""} alt="Aperçu du moment" width={500} height={400} className="w-full max-h-64 object-contain" unoptimized />
            )}
            <button
              onClick={() => { setFile(null); setPreview(null); }}
              className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors active:scale-95"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_MEDIA_TYPES}
          onChange={handleFileChange}
          className="hidden"
        />

        <div>
          <label className="block text-xs font-bold text-[var(--os-muted)] mb-1">Légende (optionnel)</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            maxLength={200}
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-3 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500 resize-none"
            placeholder="Décris ce moment..."
          />
          <p className="text-[10px] text-[var(--os-muted)] text-right">{caption.length}/200</p>
        </div>

        <div>
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

        <div>
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

        <div>
          <label className="block text-xs font-bold text-[var(--os-muted)] mb-1">ID Plan (optionnel)</label>
          <input
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            placeholder="Lier à un plan"
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-3 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--os-muted)] mb-1">ID Lieu (optionnel)</label>
          <input
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            placeholder="Lier à un lieu"
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-3 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
          />
        </div>
      </div>
    </BottomSheet>
  );
}
