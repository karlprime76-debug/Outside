"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Avatar } from "@/components/ui/avatar";
import { ArrowLeft, Shield, Users, X, Loader2, AlertTriangle } from "lucide-react";

interface SafetyContact {
  id: string;
  trustedUser: { id: string; name: string | null; image: string | null; username: string | null };
}

interface Friend {
  id: string;
  name: string | null;
  image: string | null;
  username: string | null;
}

export default function SafetySettingsPage() {
  useSession();
  const [contacts, setContacts] = useState<SafetyContact[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadContacts();
    fetch("/api/friends")
      .then((r) => r.json())
      .then((data) => setFriends(data.friends || []));
  }, []);

  async function loadContacts() {
    setLoading(true);
    try {
      const res = await fetch("/api/safety/contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function addContact(trustedUserId: string) {
    setAdding(true);
    try {
      const res = await fetch("/api/safety/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trustedUserId }),
      });
      if (res.ok) {
        loadContacts();
        setShowAdd(false);
      }
    } finally {
      setAdding(false);
    }
  }

  async function removeContact(id: string) {
    await fetch(`/api/safety/contacts/${id}`, { method: "DELETE" });
    loadContacts();
  }

  const trustedIds = new Set(contacts.map((c) => c.trustedUser.id));
  const availableFriends = friends.filter((f) => !trustedIds.has(f.id));

  return (
    <AnimatedPage className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[var(--os-fg)]">Contacts de confiance</h1>
          <p className="text-sm text-[var(--os-muted)]">Mode sécurité pour les plans</p>
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 p-4 flex items-start gap-3 dark:bg-amber-950/20">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Ce mode aide à informer un proche, mais ne remplace pas les mesures de prudence.
          OUTSIDE ne garantit pas une sécurité absolue.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-outside-500" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Shield className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-[var(--os-fg)]">Aucun contact de confiance</p>
          <p className="text-xs text-[var(--os-muted)] mt-1">
            Ajoute un ami pour activer le mode sécurité sur tes plans.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <Avatar src={c.trustedUser.image} name={c.trustedUser.name} size="md" />
                <div>
                  <p className="text-sm font-bold text-[var(--os-fg)]">{c.trustedUser.name || "Anonyme"}</p>
                  {c.trustedUser.username && (
                    <p className="text-xs text-[var(--os-muted)]">@{c.trustedUser.username}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeContact(c.id)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Retirer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full rounded-xl border-2 border-dashed border-zinc-300 py-3 text-sm font-bold text-zinc-600 hover:border-outside-400 hover:text-outside-600 transition-colors dark:border-zinc-700 dark:text-zinc-400"
          >
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ajouter un contact de confiance
            </span>
          </button>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-bold text-[var(--os-fg)] mb-3">Choisir un ami</h3>
            {availableFriends.length === 0 ? (
              <p className="text-xs text-[var(--os-muted)]">Aucun ami disponible.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableFriends.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => addContact(f.id)}
                    disabled={adding}
                    className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-left hover:bg-zinc-100 transition-colors dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  >
                    <Avatar src={f.image} name={f.name} size="sm" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--os-fg)]">{f.name || "Anonyme"}</p>
                      {f.username && <p className="text-xs text-[var(--os-muted)]">@{f.username}</p>}
                    </div>
                    <span className="text-xs font-bold text-outside-600">Ajouter</span>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowAdd(false)}
              className="mt-3 text-xs font-bold text-zinc-500 hover:text-zinc-700"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
