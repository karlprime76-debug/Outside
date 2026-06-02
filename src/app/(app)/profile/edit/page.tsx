"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Avatar } from "@/components/ui/avatar";
import { InputField } from "@/components/ui/input-field";
import { CountrySelect } from "@/components/location/country-select";
import { CityAutocomplete } from "@/components/location/city-autocomplete";
import { Camera, Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface ProfileData {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  country: string | null;
  countryCode: string | null;
  homeCity: string | null;
  activeCity: string | null;
}

export default function EditProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Impossible de charger le profil.");
      }
      const data = await res.json();
      setProfile(data);
      setName(data.name || "");
      setUsername(data.username || "");
      setBio(data.bio || "");
      setCountryCode(data.countryCode || "");
      setHomeCity(data.homeCity || "");
      setPreviewImage(data.image);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Format non accepté. Utilise JPG, PNG ou WebP.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError("Cette image est trop lourde. Maximum 3 Mo.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    setError("");

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        if (process.env.NODE_ENV === "development" && json.code) {
          // eslint-disable-next-line no-console
          console.log("[AVATAR_UPLOAD] error code:", json.code);
        }
        setError(json.message || "Impossible d'envoyer la photo. Réessaie.");
        setPreviewImage(profile?.image || null);
        return;
      }

      setPreviewImage(json.image);
      setSuccess(json.message || "Photo de profil mise à jour.");
      setTimeout(() => setSuccess(""), 3000);
      router.refresh();
    } catch {
      setError("Impossible d'envoyer la photo. Réessaie.");
      setPreviewImage(profile?.image || null);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          username: username.trim() || undefined,
          bio: bio.trim() || undefined,
          countryCode: countryCode || undefined,
          homeCity: homeCity.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Impossible de mettre à jour le profil.");
        return;
      }

      setSuccess("Profil mis à jour.");
      setTimeout(() => setSuccess(""), 3000);
      router.refresh();
    } catch {
      setError("Impossible de mettre à jour le profil.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AnimatedPage className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-outside-500" />
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="rounded-full p-2 hover:bg-[var(--os-card-border)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[var(--os-muted)]" />
        </Link>
        <h1 className="text-xl font-black text-[var(--os-fg)]">Modifier mon profil</h1>
      </div>

      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative group"
        >
          <Avatar
            src={previewImage}
            name={name || profile?.name}
            size="xl"
            className="h-24 w-24 text-2xl"
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm font-semibold text-outside-600 hover:text-outside-700 transition-colors"
        >
          Changer ma photo
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm font-semibold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-sm font-semibold text-green-600 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <InputField
          label="Nom"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ton nom"
          maxLength={80}
        />

        <InputField
          label="Nom d'utilisateur"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="@username"
          maxLength={30}
        />

        <div>
          <label className="mb-1.5 block text-sm font-bold text-[var(--os-muted)]">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Quelques mots sur toi..."
            maxLength={160}
            rows={3}
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-3 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:border-outside-400 focus:outline-none focus:ring-2 focus:ring-outside-400/20 transition-all resize-none"
          />
          <p className="mt-1 text-right text-xs text-[var(--os-muted)]">{bio.length}/160</p>
        </div>

        <div>
          <CountrySelect
            value={countryCode}
            onChange={setCountryCode}
          />
        </div>

        <div>
          <CityAutocomplete
            value={homeCity}
            onChange={setHomeCity}
            onSelect={() => {}}
            countryCode={countryCode}
            disabled={!countryCode}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Enregistrer
            </>
          )}
        </button>
      </form>
    </AnimatedPage>
  );
}
