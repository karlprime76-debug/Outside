"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { AnimatedPage } from "@/components/ui/animated-page";
import { useMomentDraft } from "@/hooks/use-moment-draft";
import { X, Image as ImageIcon, Video, Upload, MapPin, ArrowLeft, Save, Volume2 } from "lucide-react";
import { AUDIO_RIGHTS_NOTICE } from "@/lib/audio";

export default function NewMomentPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isVerticalVideo, setIsVerticalVideo] = useState<boolean>(false);
  const [publishAsClip, setPublishAsClip] = useState<boolean>(false);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);

  const draft = useMomentDraft();

  // Load city from user profile, then check for draft
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const fallbackCity = data?.user?.activeCity?.name || data?.user?.homeCity?.name || "";

        // Check for existing draft
        const existing = draft.restoreDraft();
        if (existing) {
          setShowDraftPrompt(true);
          // Use draft city if present, else fallback
          setCity(existing.city || fallbackCity);
          setCaption(existing.caption || "");
          setVisibility(existing.visibility || "PUBLIC");
          setPublishAsClip(existing.publishAsClip || false);
        } else {
          setCity(fallbackCity);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft on field changes
  useEffect(() => {
    if (caption || city || visibility !== "PUBLIC" || publishAsClip) {
      draft.saveDraft({ caption, visibility, city, publishAsClip });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caption, visibility, city, publishAsClip]);

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

    // Detect simple orientation for video to suggest Clip UX
    if (selected.type.startsWith("video/")) {
      try {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.src = url;
        v.onloadedmetadata = () => {
          const vertical = v.videoHeight > v.videoWidth;
          setIsVerticalVideo(vertical);
          setPublishAsClip(vertical);
          URL.revokeObjectURL(v.src);
        };
      } catch {
        setIsVerticalVideo(false);
        setPublishAsClip(false);
      }
    } else {
      setIsVerticalVideo(false);
      setPublishAsClip(false);
    }
  }

  async function submit() {
    if (!file) return;

    const hasContext = city.trim();
    if (!hasContext) {
      addToast("Un moment doit être lié à une ville.", "error");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (caption.trim()) formData.append("caption", caption.trim());
      formData.append("visibility", visibility);
      if (city.trim()) formData.append("city", city.trim());

      const res = await fetch("/api/moments", { method: "POST", body: formData });
      if (res.ok) {
        draft.clearDraft();
        addToast("Moment publié !", "success");
        router.push("/moments");
        router.refresh();
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
    <AnimatedPage className="p-4 max-w-xl mx-auto space-y-6 pb-24 md:pb-4">
      <Link
        href="/moments"
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux moments
      </Link>

      <div>
        <h1 className="text-2xl font-black text-[var(--os-fg)] flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-outside-500 to-accent-500 p-2.5 shadow-glow">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          Ajouter un moment
        </h1>
        <p className="mt-1 text-sm text-[var(--os-muted)]">
          Un Moment doit montrer ce qui se passe dehors.
        </p>
        <p className="mt-1 text-[11px] text-[var(--os-muted)]">
          Les clips montrent l&apos;ambiance dehors en vidéo.
        </p>
      </div>

      {/* Draft prompt */}
      {showDraftPrompt && (
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

      {/* Draft restored but no media */}
      {draft.draft && !showDraftPrompt && !file && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2 dark:border-amber-900 dark:bg-amber-950/20">
          <MapPin className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Ajoute à nouveau ton média pour publier ce brouillon.
          </p>
        </div>
      )}

      {/* Auto-save indicator */}
      {draft.savedAt && !showDraftPrompt && (
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--os-muted)] animate-fade-in">
          <Save className="h-3 w-3" />
          <span>Brouillon enregistré</span>
        </div>
      )}

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--os-card-border)] bg-[var(--os-bg)] p-12 cursor-pointer hover:border-outside-300 transition-colors"
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
            <video src={preview || undefined} className="w-full aspect-video object-cover" controls />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview || undefined} alt="Aperçu du moment" className="w-full aspect-video object-cover" />
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
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="space-y-4">
        {file?.type.startsWith("video/") && (
          <div className="flex items-center justify-between rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-3">
            <div>
              <p className="text-sm font-bold text-[var(--os-fg)]">Publier comme clip</p>
              <p className="text-xs text-[var(--os-muted)]">{isVerticalVideo ? "Vidéo verticale détectée" : "Vidéo classique"}</p>
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
          <label className="block text-xs font-bold text-[var(--os-muted)] mb-1">Légende (optionnel)</label>
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
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
        <MapPin className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">
          Ta position exacte ne sera jamais affichée.
        </p>
      </div>

      <button
        onClick={submit}
        disabled={!file || loading}
        className="w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Upload className="h-4 w-4" />
        {loading ? "Publication..." : "Publier le moment"}
      </button>
    </AnimatedPage>
  );
}
