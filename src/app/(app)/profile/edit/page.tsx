"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Avatar } from "@/components/ui/avatar";
import { InputField } from "@/components/ui/input-field";
import { CountrySelect } from "@/components/location/country-select";
import { CityAutocomplete } from "@/components/location/city-autocomplete";
import { Camera, Save, ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface SocialLink {
  platform: string;
  url: string;
  label: string;
}

const SOCIAL_PLATFORMS = [
  { value: "website", label: "Site web" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "Twitter / X" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "github", label: "GitHub" },
];

interface ProfileData {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  coverImage: string | null;
  bio: string | null;
  socialLinks: string | null;
  gender: string | null;
  country: string | null;
  countryCode: string | null;
  homeCity: string | null;
  activeCity: string | null;
  birthDate?: string | null;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewCover, setPreviewCover] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        if (res.status === 401) { router.push("/login"); return; }
        throw new Error("Impossible de charger le profil.");
      }
      const data = await res.json();
      setProfile(data);
      setName(data.name || "");
      setUsername(data.username || "");
      setBio(data.bio || "");
      setGender(data.gender || "");
      setCountryCode(data.countryCode || "");
      setHomeCity(data.homeCity || "");
      setPreviewImage(data.image);
      setPreviewCover(data.coverImage);
      if (data.socialLinks) {
        try { setSocialLinks(JSON.parse(data.socialLinks)); } catch { setSocialLinks([]); }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  async function uploadFile(file: File, endpoint: string, type: "avatar" | "cover") {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Format non accepté. Utilise JPG, PNG ou WebP.");
      return null;
    }
    const maxSize = type === "cover" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Cette image est trop lourde. Maximum ${type === "cover" ? "10" : "5"} Mo.`);
      return null;
    }

    if (type === "avatar") setUploadingAvatar(true);
    else setUploadingCover(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) { setError(json.message || "Impossible d'envoyer l'image."); return null; }
      if (type === "avatar") {
        setPreviewImage(json.image || json.coverImage);
        await updateSession({ image: json.image });
      } else {
        setPreviewCover(json.coverImage);
      }
      setSuccess(json.message || "Image mise à jour.");
      setTimeout(() => setSuccess(""), 3000);
      router.refresh();
      return json;
    } catch {
      setError("Impossible d'envoyer l'image. Réessaie.");
      return null;
    } finally {
      if (type === "avatar") setUploadingAvatar(false);
      else setUploadingCover(false);
    }
  }

  function addSocialLink() {
    setSocialLinks([...socialLinks, { platform: "website", url: "", label: "" }]);
  }

  function updateSocialLink(i: number, field: keyof SocialLink, value: string) {
    const updated = [...socialLinks];
    updated[i] = { ...updated[i], [field]: value };
    if (field === "platform" || field === "url") {
      const platform = field === "platform" ? value : updated[i].platform;
      const pl = SOCIAL_PLATFORMS.find((p) => p.value === platform);
      if (field === "platform") updated[i].label = pl?.label || platform;
    }
    setSocialLinks(updated);
  }

  function removeSocialLink(i: number) {
    setSocialLinks(socialLinks.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: Record<string, unknown> = {
        name: name.trim() || undefined,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        gender: gender || undefined,
        countryCode: countryCode || undefined,
        homeCity: homeCity.trim() || undefined,
        socialLinks: socialLinks.filter((l) => l.url.trim()).length > 0
          ? JSON.stringify(socialLinks.filter((l) => l.url.trim()))
          : undefined,
      };
      if (profile && !profile.birthDate && birthDate) payload.birthDate = birthDate;

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) { setError(json.error || "Impossible de mettre à jour le profil."); return; }

      setProfile(json);
      setSuccess("Profil mis à jour.");
      setTimeout(() => setSuccess(""), 3000);
      await updateSession({ name: json.name, image: json.image });
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
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/profile" className="rounded-full p-2 hover:bg-[var(--os-card-border)] transition-colors">
          <ArrowLeft className="h-5 w-5 text-[var(--os-muted)]" />
        </Link>
        <h1 className="text-xl font-black text-[var(--os-fg)]">Modifier mon profil</h1>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm font-semibold text-red-600 dark:text-red-400">{error}</div>
      )}
      {success && (
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-sm font-semibold text-green-600 dark:text-green-400">{success}</div>
      )}

      {/* Cover photo */}
      <div>
        <label className="mb-1.5 block text-sm font-bold text-[var(--os-muted)]">Photo de couverture</label>
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          className="relative w-full h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-outside-500 to-accent-600 group"
        >
          {previewCover ? (
            <img src={previewCover} alt="" className="h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            {uploadingCover ? (
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            ) : (
              <Camera className="h-8 w-8 text-white opacity-70 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </button>
        <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, "/api/profile/cover", "cover"); }} />
      </div>

      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-3">
        <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="relative group">
          <Avatar src={previewImage} name={name || profile?.name} size="xl" className="h-24 w-24 text-2xl" />
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>
          {uploadingAvatar && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </button>
        <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, "/api/profile/avatar", "avatar"); }} />
        <button type="button" onClick={() => avatarInputRef.current?.click()}
          className="text-sm font-semibold text-outside-600 hover:text-outside-700 transition-colors">
          Changer ma photo
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <InputField label="Nom" name="name" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Ton nom" maxLength={80} />
        <InputField label="Nom d'utilisateur" name="username" value={username}
          onChange={(e) => setUsername(e.target.value)} placeholder="@username" maxLength={30} />

        <div>
          <label className="mb-1.5 block text-sm font-bold text-[var(--os-muted)]">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)}
            placeholder="Quelques mots sur toi..." maxLength={500} rows={4}
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-3 text-sm text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:border-outside-400 focus:outline-none focus:ring-2 focus:ring-outside-400/20 transition-all resize-none" />
          <p className="mt-1 text-right text-xs text-[var(--os-muted)]">{bio.length}/500</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-[var(--os-muted)]">Sexe</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)}
            className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-3 text-sm text-[var(--os-fg)] focus:border-outside-400 focus:outline-none focus:ring-2 focus:ring-outside-400/20 transition-all">
            <option value="">Sélectionne&hellip;</option>
            <option value="MALE">Homme</option>
            <option value="FEMALE">Femme</option>
            <option value="OTHER">Autre</option>
            <option value="PREFER_NOT_TO_SAY">Je préfère ne pas préciser</option>
          </select>
        </div>

        <CountrySelect value={countryCode} onChange={setCountryCode} />
        <CityAutocomplete value={homeCity} onChange={setHomeCity} onSelect={() => {}} countryCode={countryCode} disabled={!countryCode} />

        {!profile?.birthDate && (
          <div>
            <label className="mb-1.5 block text-sm font-bold text-[var(--os-muted)]">Date de naissance (non modifiable)</label>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-3 text-sm text-[var(--os-fg)] focus:border-outside-400 focus:outline-none focus:ring-2 focus:ring-outside-400/20 transition-all" />
            <p className="text-[10px] text-[var(--os-muted)] mt-1">Tu dois avoir au moins 18 ans pour utiliser OUTSIDE. Cette information ne pourra pas être modifiée.</p>
          </div>
        )}

        {/* Social Links */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-[var(--os-muted)]">Réseaux sociaux</label>
            <button type="button" onClick={addSocialLink}
              className="inline-flex items-center gap-1 text-xs font-bold text-outside-600 hover:text-outside-700 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Ajouter un lien
            </button>
          </div>
          {socialLinks.map((link, i) => (
            <div key={i} className="flex items-start gap-2">
              <select value={link.platform} onChange={(e) => updateSocialLink(i, "platform", e.target.value)}
                className="w-32 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-2.5 text-xs text-[var(--os-fg)] focus:border-outside-400 focus:outline-none">
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <input type="url" value={link.url} onChange={(e) => updateSocialLink(i, "url", e.target.value)}
                placeholder="https://..." maxLength={500}
                className="flex-1 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-2.5 text-xs text-[var(--os-fg)] placeholder:text-[var(--os-muted)] focus:border-outside-400 focus:outline-none focus:ring-2 focus:ring-outside-400/20 transition-all" />
              <button type="button" onClick={() => removeSocialLink(i)}
                className="rounded-xl p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button type="submit" disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all pressable disabled:opacity-60">
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Enregistrement...</>
          ) : (
            <><Save className="h-4 w-4" />Enregistrer</>
          )}
        </button>
      </form>
    </AnimatedPage>
  );
}
