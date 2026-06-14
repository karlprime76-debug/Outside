"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { isValidAudioType, MAX_AUDIO_SIZE, AUDIO_RIGHTS_NOTICE } from "@/lib/audio";
import { Search, Upload, Play, Pause, Check, X, Volume1 } from "lucide-react";

interface AudioTrackItem {
  id: string;
  title: string;
  artistName: string | null;
  audioUrl: string;
  duration: number | null;
  usageCount: number;
  isOfficial: boolean;
  isOriginal: boolean;
  isFromPixabay?: boolean;
}

interface AudioPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (track: AudioTrackItem | null, opts?: { isOriginal?: boolean; title?: string }) => void;
  selectedTrackId?: string | null;
}

export function AudioPicker({ open, onClose, onSelect, selectedTrackId }: AudioPickerProps) {
  const { addToast } = useToast();
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<AudioTrackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadArtist, setUploadArtist] = useState("");
  const [uploadOriginal, setUploadOriginal] = useState(false);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchTracks = useCallback(
    async (search?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("q", search);
        params.set("limit", "20");
        if (search && search.length >= 2) params.set("source", "pixabay");
        const res = await fetch(`/api/audio/tracks?${params.toString()}`);
        const data = await res.json();
        if (res.ok) setTracks(data.tracks || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (open && tab === "library") fetchTracks();
  }, [open, tab, fetchTracks]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (tab === "library") fetchTracks(query);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, tab, fetchTracks]);

  const handlePlayPreview = (track: AudioTrackItem) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const a = new Audio(track.audioUrl);
    a.volume = 0.5;
    a.onended = () => setPlayingId(null);
    a.onerror = () => {
      setPlayingId(null);
      addToast("Aperçu indisponible", "error");
    };
    audioRef.current = a;
    a.play().catch(() => setPlayingId(null));
    setPlayingId(track.id);
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      addToast("Sélectionne un fichier audio.", "error");
      return;
    }
    if (!uploadTitle.trim()) {
      addToast("Le titre est requis.", "error");
      return;
    }
    if (!isValidAudioType(file.type)) {
      addToast("Format non accepté.", "error");
      return;
    }
    if (file.size > MAX_AUDIO_SIZE) {
      addToast("Fichier audio max 10 Mo.", "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", uploadTitle.trim());
      if (uploadArtist.trim()) formData.append("artistName", uploadArtist.trim());
      formData.append("isOriginal", String(uploadOriginal));
      formData.append("rightsConfirmed", String(rightsConfirmed));

      const res = await fetch("/api/audio/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.track) {
        addToast("Son ajouté.", "success");
        onSelect(data.track);
        onClose();
      } else {
        addToast(data.error || "Erreur lors de l'upload", "error");
      }
    } catch {
      addToast("Erreur réseau", "error");
    } finally {
      setUploading(false);
    }
  };

  const formatDuration = (s: number | null) => {
    if (!s) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Ajouter une musique">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex rounded-xl bg-[var(--os-bg)] border border-[var(--os-card-border)] p-1">
          <button
            onClick={() => setTab("library")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${
              tab === "library"
                ? "bg-[var(--os-card)] text-[var(--os-fg)] shadow-sm"
                : "text-[var(--os-muted)]"
            }`}
          >
            Bibliothèque
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${
              tab === "upload"
                ? "bg-[var(--os-card)] text-[var(--os-fg)] shadow-sm"
                : "text-[var(--os-muted)]"
            }`}
          >
            Importer
          </button>
        </div>

        {tab === "library" && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--os-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un son..."
                className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] pl-9 pr-3 py-2.5 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
              />
            </div>

            {/* No original sound option for videos */}
            <button
              onClick={() => onSelect(null, { isOriginal: true, title: "Son original" })}
              className="w-full flex items-center gap-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] px-3 py-3 text-left hover:bg-[var(--os-card)] transition-colors active:scale-[0.98]"
            >
              <div className="rounded-full bg-outside-500/10 p-2">
                <Volume1 className="h-4 w-4 text-outside-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--os-fg)]">Utiliser un son original</p>
                <p className="text-[11px] text-[var(--os-muted)]">L&apos;audio de la vidéo sera conservé</p>
              </div>
              {selectedTrackId === null && <Check className="h-4 w-4 text-outside-500 ml-auto" />}
            </button>

            {/* No sound option */}
            <button
              onClick={() => onSelect(null)}
              className="w-full flex items-center gap-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] px-3 py-3 text-left hover:bg-[var(--os-card)] transition-colors active:scale-[0.98]"
            >
              <div className="rounded-full bg-[var(--os-card-border)] p-2">
                <X className="h-4 w-4 text-[var(--os-muted)]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--os-fg)]">Aucun son</p>
                <p className="text-[11px] text-[var(--os-muted)]">Publier sans musique</p>
              </div>
              {selectedTrackId === undefined && <Check className="h-4 w-4 text-outside-500 ml-auto" />}
            </button>

            {/* Track list */}
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-[var(--os-bg)] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors cursor-pointer ${
                      selectedTrackId === track.id
                        ? "bg-outside-500/10 border border-outside-500/20"
                        : "border border-transparent hover:bg-[var(--os-bg)]"
                    }`}
                  >
                    <button
                      onClick={() => handlePlayPreview(track)}
                      className="rounded-full bg-[var(--os-card-border)] p-1.5 hover:bg-outside-500/20 transition-colors"
                    >
                      {playingId === track.id ? (
                        <Pause className="h-3.5 w-3.5 text-[var(--os-fg)]" />
                      ) : (
                        <Play className="h-3.5 w-3.5 text-[var(--os-fg)]" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--os-fg)] truncate">{track.title}</p>
                      <p className="text-[11px] text-[var(--os-muted)] truncate">
                        {track.artistName || "Artiste inconnu"} · {formatDuration(track.duration)} · {track.usageCount} utilisations
                      </p>
                    </div>
                    {track.isFromPixabay ? (
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500">
                        PIXABAY
                      </span>
                    ) : track.isOfficial && (
                      <span className="rounded-full bg-outside-500/10 px-2 py-0.5 text-[10px] font-bold text-outside-500">
                        OFFICIEL
                      </span>
                    )}
                    <button
                      onClick={() => {
                        onSelect(track);
                        onClose();
                      }}
                      className="rounded-full bg-outside-500 px-3 py-1 text-[11px] font-bold text-white hover:bg-outside-600 transition-colors active:scale-95"
                    >
                      Utiliser
                    </button>
                  </div>
                ))}
                {tracks.length === 0 && !query && (
                  <p className="text-center text-xs text-[var(--os-muted)] py-6">
                    Aucun son disponible pour le moment.
                  </p>
                )}
                {tracks.length === 0 && query && (
                  <p className="text-center text-xs text-[var(--os-muted)] py-6">
                    Aucun résultat pour &quot;{query}&quot;
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {tab === "upload" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
              <p className="text-xs text-amber-700 dark:text-amber-400">{AUDIO_RIGHTS_NOTICE}</p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/webm,audio/mp4,audio/aac,audio/ogg"
              className="hidden"
            />

            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--os-card-border)] bg-[var(--os-bg)] p-8 cursor-pointer hover:border-outside-300 transition-colors"
            >
              <Upload className="h-6 w-6 text-[var(--os-muted)]" />
              <p className="text-sm text-[var(--os-muted)]">Sélectionner un fichier audio</p>
              <p className="text-[10px] text-[var(--os-muted)]">MP3, WAV, AAC, OGG — max 10 Mo</p>
            </button>

            {fileRef.current?.files?.[0] && (
              <p className="text-xs text-[var(--os-fg)] text-center">
                {fileRef.current.files[0].name} ({(fileRef.current.files[0].size / 1024 / 1024).toFixed(1)} Mo)
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-[var(--os-muted)] mb-1">Titre *</label>
              <input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Titre du son"
                className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-3 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--os-muted)] mb-1">Artiste</label>
              <input
                value={uploadArtist}
                onChange={(e) => setUploadArtist(e.target.value)}
                placeholder="Nom de l'artiste"
                className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-bg)] p-3 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:outline-none focus:ring-2 focus:ring-outside-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={uploadOriginal}
                onChange={(e) => setUploadOriginal(e.target.checked)}
                className="h-4 w-4 accent-outside-500"
              />
              <span className="text-xs text-[var(--os-fg)]">Ceci est un son original</span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rightsConfirmed}
                onChange={(e) => setRightsConfirmed(e.target.checked)}
                className="h-4 w-4 accent-outside-500 mt-0.5"
              />
              <span className="text-xs text-[var(--os-fg)] leading-relaxed">
                Je confirme avoir les droits ou l&apos;autorisation d&apos;utiliser ce son.
              </span>
            </label>

            <button
              onClick={handleUpload}
              disabled={uploading || !uploadTitle.trim() || !fileRef.current?.files?.[0] || !rightsConfirmed}
              className="w-full rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Envoi..." : "Ajouter le son"}
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
