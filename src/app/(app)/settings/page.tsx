"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatedPage } from "@/components/ui/animated-page";
import {
  ArrowLeft,
  Bell,
  Moon,
  Globe,
  Shield,
  Eye,
  Trash2,
  ChevronRight,
  User,
  AtSign,
  Mail,
  LogOut,
  UserPlus,
  Users,
  Radio,
  Calendar,
  Image,
} from "lucide-react";

interface UserSettingsData {
  profileVisibility: string;
  showCityOnProfile: boolean;
  allowFriendRequests: boolean;
  allowFollowers: boolean;
  allowFriendSuggestions: boolean;
  notificationFriendRequests: boolean;
  notificationPlanInvites: boolean;
  notificationCityLives: boolean;
  notificationProEvents: boolean;
  notificationMoments: boolean;
}

const DEFAULT_SETTINGS: UserSettingsData = {
  profileVisibility: "PUBLIC",
  showCityOnProfile: true,
  allowFriendRequests: true,
  allowFollowers: true,
  allowFriendSuggestions: true,
  notificationFriendRequests: true,
  notificationPlanInvites: true,
  notificationCityLives: true,
  notificationProEvents: true,
  notificationMoments: true,
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettingsData>(DEFAULT_SETTINGS);

  // Load settings from API
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Debounced auto-save
  const saveSettings = useCallback(
    async (patch: Partial<UserSettingsData>) => {
      setSaving(true);
      try {
        const res = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings((prev) => ({ ...prev, ...data.settings }));
          }
        } else {
          addToast("Erreur lors de la sauvegarde", "error");
        }
      } catch {
        addToast("Erreur réseau", "error");
      } finally {
        setSaving(false);
      }
    },
    [addToast]
  );

  function updateSetting<K extends keyof UserSettingsData>(
    key: K,
    value: UserSettingsData[K]
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    saveSettings({ [key]: value });
  }

  function Toggle({
    label,
    value,
    onChange,
    icon: Icon,
  }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
    icon: typeof Bell;
  }) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-[var(--os-card-border)] last:border-0">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-outside-100 p-2">
            <Icon className="h-4 w-4 text-outside-600" />
          </div>
          <span className="text-sm font-semibold text-[var(--os-fg)]">{label}</span>
        </div>
        <button
          onClick={() => onChange(!value)}
          className={`relative h-7 w-12 rounded-full transition-colors ${
            value ? "bg-outside-500" : "bg-zinc-300 dark:bg-zinc-700"
          }`}
          aria-pressed={value}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              value ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    );
  }

  function Section({
    title,
    children,
    danger,
  }: {
    title: string;
    children: React.ReactNode;
    danger?: boolean;
  }) {
    return (
      <section
        className={`p-5 ${
          danger
            ? "rounded-2xl border border-red-200 bg-red-50"
            : "os-card"
        }`}
      >
        <h2
          className={`text-xs font-black uppercase tracking-wider mb-3 ${
            danger ? "text-red-600" : "text-[var(--os-muted)]"
          }`}
        >
          {title}
        </h2>
        {children}
      </section>
    );
  }

  if (loading) {
    return (
      <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="h-12 w-12 rounded-full bg-[var(--os-card-border)]" />
          <div className="space-y-2">
            <div className="h-6 w-32 rounded bg-[var(--os-card-border)]" />
            <div className="h-4 w-48 rounded bg-[var(--os-card-border)]" />
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="os-card p-5 animate-pulse space-y-3">
            <div className="h-3 w-24 rounded bg-[var(--os-card-border)]" />
            <div className="h-10 w-full rounded bg-[var(--os-card-border)]" />
            <div className="h-10 w-full rounded bg-[var(--os-card-border)]" />
          </div>
        ))}
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="p-4 max-w-2xl mx-auto space-y-6 pb-24 md:pb-4">
      {/* Back link */}
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-sm font-bold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au profil
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar src={session?.user?.image} name={session?.user?.name} size="xl" />
        <div>
          <h1 className="text-2xl font-black text-[var(--os-fg)]">Paramètres</h1>
          <p className="text-sm text-[var(--os-muted)]">{session?.user?.email}</p>
          {saving && (
            <p className="text-[10px] text-[var(--os-muted)] mt-0.5">Sauvegarde...</p>
          )}
        </div>
      </div>

      {/* Compte */}
      <Section title="Compte">
        <div className="space-y-3">
          <div className="flex items-center gap-3 py-2">
            <User className="h-4 w-4 text-outside-600" />
            <div>
              <p className="text-xs text-[var(--os-muted)]">Nom</p>
              <p className="text-sm font-semibold text-[var(--os-fg)]">
                {session?.user?.name || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2">
            <AtSign className="h-4 w-4 text-outside-600" />
            <div>
              <p className="text-xs text-[var(--os-muted)]">Nom d&apos;utilisateur</p>
              <p className="text-sm font-semibold text-[var(--os-fg)]">
                {session?.user?.username || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2">
            <Mail className="h-4 w-4 text-outside-600" />
            <div>
              <p className="text-xs text-[var(--os-muted)]">Email</p>
              <p className="text-sm font-semibold text-[var(--os-fg)]">
                {session?.user?.email || "—"}
              </p>
            </div>
          </div>
          <Link
            href="/profile/edit"
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-outside-500 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
          >
            Modifier le profil
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Section>

      {/* Apparence */}
      <Section title="Apparence">
        <div className="flex items-center justify-between py-3 border-b border-[var(--os-card-border)]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-outside-100 p-2">
              <Moon className="h-4 w-4 text-outside-600" />
            </div>
            <span className="text-sm font-semibold text-[var(--os-fg)]">Thème</span>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-outside-100 p-2">
              <Globe className="h-4 w-4 text-outside-600" />
            </div>
            <span className="text-sm font-semibold text-[var(--os-fg)]">Langue</span>
          </div>
          <select
            value={session?.user?.language || "fr"}
            disabled
            className="rounded-lg border border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-1.5 text-sm text-[var(--os-fg)] opacity-60 cursor-not-allowed"
            title="Langue synchronisée avec ton profil"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
      </Section>

      {/* Confidentialité */}
      <Section title="Confidentialité">
        <div className="flex items-center justify-between py-3 border-b border-[var(--os-card-border)]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-outside-100 p-2">
              <Eye className="h-4 w-4 text-outside-600" />
            </div>
            <span className="text-sm font-semibold text-[var(--os-fg)]">
              Visibilité du profil
            </span>
          </div>
          <select
            value={settings.profileVisibility}
            onChange={(e) => updateSetting("profileVisibility", e.target.value)}
            className="rounded-lg border border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-1.5 text-sm text-[var(--os-fg)]"
          >
            <option value="PUBLIC">Public</option>
            <option value="FRIENDS">Amis</option>
            <option value="PRIVATE">Privé</option>
          </select>
        </div>
        <Toggle
          label="Afficher ma ville sur mon profil"
          value={settings.showCityOnProfile}
          onChange={(v) => updateSetting("showCityOnProfile", v)}
          icon={Eye}
        />
        <Toggle
          label="Autoriser les demandes d&apos;amis"
          value={settings.allowFriendRequests}
          onChange={(v) => updateSetting("allowFriendRequests", v)}
          icon={UserPlus}
        />
        <Toggle
          label="Autoriser les abonnements"
          value={settings.allowFollowers}
          onChange={(v) => updateSetting("allowFollowers", v)}
          icon={Users}
        />
        <Toggle
          label="Autoriser les suggestions d&apos;amis"
          value={settings.allowFriendSuggestions}
          onChange={(v) => updateSetting("allowFriendSuggestions", v)}
          icon={Users}
        />
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Toggle
          label="Demandes d&apos;amis"
          value={settings.notificationFriendRequests}
          onChange={(v) => updateSetting("notificationFriendRequests", v)}
          icon={UserPlus}
        />
        <Toggle
          label="Invitations aux plans"
          value={settings.notificationPlanInvites}
          onChange={(v) => updateSetting("notificationPlanInvites", v)}
          icon={Calendar}
        />
        <Toggle
          label="Lives dans ma ville"
          value={settings.notificationCityLives}
          onChange={(v) => updateSetting("notificationCityLives", v)}
          icon={Radio}
        />
        <Toggle
          label="Événements pro"
          value={settings.notificationProEvents}
          onChange={(v) => updateSetting("notificationProEvents", v)}
          icon={Calendar}
        />
        <Toggle
          label="Moments autour de moi"
          value={settings.notificationMoments}
          onChange={(v) => updateSetting("notificationMoments", v)}
          icon={Image}
        />
      </Section>

      {/* Sécurité */}
      <Section title="Sécurité">
        <div className="flex items-center justify-between py-3 border-b border-[var(--os-card-border)]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-outside-100 p-2">
              <Shield className="h-4 w-4 text-outside-600" />
            </div>
            <span className="text-sm font-semibold text-[var(--os-fg)]">
              Vérifier mon identité
            </span>
          </div>
          <Link
            href="/settings/verification"
            className="text-sm font-bold text-outside-600 flex items-center gap-1"
          >
            Vérifier
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-red-50"
        >
          <LogOut className="h-5 w-5 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-600">Se déconnecter</p>
            <p className="text-xs text-red-400">Terminer la session actuelle</p>
          </div>
          <ChevronRight className="h-4 w-4 text-red-400" />
        </button>
      </Section>

      {/* Danger zone */}
      <Section title="Zone dangereuse" danger>
        <button
          onClick={() => {
            if (
              confirm(
                "Es-tu sûr de vouloir supprimer ton compte ? Cette action sera disponible prochainement."
              )
            ) {
              addToast("Suppression de compte disponible prochainement.", "info");
            }
          }}
          className="flex w-full items-center gap-3 rounded-xl bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-red-100"
        >
          <Trash2 className="h-5 w-5 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-600">Supprimer le compte</p>
            <p className="text-xs text-red-400">Disponible prochainement</p>
          </div>
          <ChevronRight className="h-4 w-4 text-red-400" />
        </button>
      </Section>
    </AnimatedPage>
  );
}
