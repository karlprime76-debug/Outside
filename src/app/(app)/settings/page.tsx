"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeft,
  Bell,
  Moon,
  Globe,
  Shield,
  Eye,
  Trash2,
  ChevronRight,
  Volume2,
  Vibrate,
} from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [language, setLanguage] = useState("fr");
  const [visibility, setVisibility] = useState("PUBLIC");

  async function deleteAccount() {
    if (!confirm("Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { method: "DELETE" });
      if (res.ok) {
        addToast("Compte supprimé", "success");
        window.location.href = "/";
      } else {
        addToast("Erreur lors de la suppression", "error");
      }
    } catch {
      addToast("Erreur réseau", "error");
    } finally {
      setLoading(false);
    }
  }

  const toggleRow = (
    Icon: typeof Bell,
    label: string,
    value: boolean,
    onChange: (v: boolean) => void
  ) => (
    <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-surface-border">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-outside-100 p-2 dark:bg-outside-950/20">
          <Icon className="h-4 w-4 text-outside-600 dark:text-outside-400" />
        </div>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</span>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 rounded-full transition-colors ${
          value ? "bg-outside-500" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au profil
      </Link>

      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Avatar src={session?.user?.image} name={session?.user?.name} size="xl" />
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Paramètres</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {session?.user?.email}
          </p>
        </div>
      </div>

      {/* Preferences */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-surface-border dark:bg-surface-card">
        <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
          Préférences
        </h2>
        {toggleRow(Bell, "Notifications", notifications, setNotifications)}
        {toggleRow(Volume2, "Son", sound, setSound)}
        {toggleRow(Vibrate, "Vibrations", haptics, setHaptics)}
      </section>

      {/* Appearance */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-surface-border dark:bg-surface-card">
        <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
          Apparence
        </h2>
        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-surface-border">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-outside-100 p-2 dark:bg-outside-950/20">
              <Moon className="h-4 w-4 text-outside-600 dark:text-outside-400" />
            </div>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Thème</span>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-surface-border">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-outside-100 p-2 dark:bg-outside-950/20">
              <Globe className="h-4 w-4 text-outside-600 dark:text-outside-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Langue</span>
          </div>
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              addToast("Langue changée", "success");
            }}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:bg-surface-card dark:border-surface-border dark:text-zinc-100"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
      </section>

      {/* Privacy */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-surface-border dark:bg-surface-card">
        <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
          Confidentialité
        </h2>
        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-surface-border">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-outside-100 p-2 dark:bg-outside-950/20">
              <Eye className="h-4 w-4 text-outside-600 dark:text-outside-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Visibilité du profil</span>
          </div>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:bg-surface-card dark:border-surface-border dark:text-zinc-100"
          >
            <option value="PUBLIC">Public</option>
            <option value="FRIENDS">Amis</option>
            <option value="PRIVATE">Privé</option>
          </select>
        </div>
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-outside-100 p-2 dark:bg-outside-950/20">
              <Shield className="h-4 w-4 text-outside-600 dark:text-outside-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Vérification</span>
          </div>
          <Link
            href="/profile"
            className="text-sm font-bold text-outside-600 dark:text-outside-400 flex items-center gap-1"
          >
            Voir le profil
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/30 dark:bg-red-950/20">
        <h2 className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 mb-3">
          Zone dangereuse
        </h2>
        <button
          onClick={deleteAccount}
          disabled={loading}
          className="flex w-full items-center gap-3 rounded-xl bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-red-100 dark:bg-surface-card dark:hover:bg-red-950/30"
        >
          <Trash2 className="h-5 w-5 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              Supprimer le compte
            </p>
            <p className="text-xs text-red-400 dark:text-red-500">
              Irréversible. Toutes tes données seront perdues.
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-red-400" />
        </button>
      </section>
    </div>
  );
}
