"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useToast } from "@/components/ui/toast";
import { X, Image, Video, Upload, MapPin } from "lucide-react";

interface Props {
  onClose: () => void;
  onUploaded?: () => void;
  defaultCity?: string;
  defaultPlanId?: string;
  defaultPlaceId?: string;
}

export function MomentUploadSheet({ onClose, onUploaded, defaultCity, defaultPlanId, defaultPlaceId }: Props) {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [city, setCity] = useState(defaultCity || "");
  const [loading, setLoading] = useState(false);
  const [planId, setPlanId] = useState(defaultPlanId || "");
  const [placeId, setPlaceId] = useState(defaultPlaceId || "");

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowed = [
      "image/jpeg", "image/png", "image/webp",
      "video/mp4", "video/webm",
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
  }

  async function submit() {
    if (!file) return;

    const hasContext = city.trim() || planId || placeId;
    if (!hasContext) {
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
        addToast("Moment publié !", "success");
        onUploaded?.();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        addToast(data.error || "Erreur lors de la publication", "error");
      }
    } catch {
      addToast("Erreur réseau", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center px-0 sm:px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-card dark:border dark:border-surface-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-[var(--os-fg)]">Ajouter un moment</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-4 w-4 text-[var(--os-muted)]" />
          </button>
        </div>

        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--os-card-border)] bg-[var(--os-bg)] p-10 cursor-pointer hover:border-outside-300 transition-colors"
          >
            <div className="flex gap-3">
              <Image className="h-8 w-8 text-[var(--os-muted)]" />
              <Video className="h-8 w-8 text-[var(--os-muted)]" />
            </div>
            <p className="text-sm text-[var(--os-muted)] text-center">
              Photo (max 5 Mo) ou vidéo (max 50 Mo)
            </p>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-black">
            {file.type.startsWith("video/") ? (
              <video src={preview || undefined} className="w-full max-h-64 object-contain" controls />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview || undefined} alt="Aperçu du moment" className="w-full max-h-64 object-contain" />
            )}
            <button
              onClick={() => { setFile(null); setPreview(null); }}
              className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mt-4 space-y-3">
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

        <button
          onClick={submit}
          disabled={!file || loading}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {loading ? "Publication..." : "Publier le moment"}
        </button>
      </div>
    </div>
  );
}
