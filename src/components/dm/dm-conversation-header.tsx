"use client";

import Link from "next/link";
import { ArrowLeft, MoreVertical, Phone, ShieldAlert, User, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useState } from "react";
import { useHaptic } from "@/hooks/use-haptic";

interface DmConversationHeaderProps {
  other: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
  onBack?: () => void;
}

export function DmConversationHeader({ other, onBack }: DmConversationHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const haptic = useHaptic();

  return (
    <div className="sticky top-0 z-40 border-b border-[var(--os-card-border)] bg-[var(--os-bg)]/95 backdrop-blur-md px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            aria-label="Retour"
            className="rounded-full p-2 hover:bg-[var(--os-card-border)] transition-colors shrink-0 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5 text-[var(--os-fg)]" />
          </button>

          {other ? (
            <Link
              href={`/u/${other.username || other.id}`}
              className="flex items-center gap-2.5 min-w-0"
            >
              <Avatar src={other.image} name={other.name} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--os-fg)] truncate leading-tight">
                  {other.name || other.username || "Utilisateur"}
                </p>
                <p className="text-[11px] text-[var(--os-muted)] truncate leading-tight">
                  @{other.username || "user"}
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-[var(--os-card)] animate-pulse" />
              <div className="space-y-1">
                <div className="h-3.5 w-20 rounded bg-[var(--os-card)] animate-pulse" />
                <div className="h-2.5 w-14 rounded bg-[var(--os-card)] animate-pulse" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Call button — hidden until feature ready */}
          {false && (
            <button
              aria-label="Appel audio"
              className="rounded-full p-2 text-[var(--os-muted)] hover:bg-[var(--os-card-border)] transition-colors"
              title="Appels bientôt disponibles"
            >
              <Phone className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => { haptic.light(); setMenuOpen(true); }}
            aria-label="Options"
            className="rounded-full p-2 text-[var(--os-fg)] hover:bg-[var(--os-card-border)] transition-colors active:scale-95"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          <BottomSheet
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            title="Options"
          >
            <div className="space-y-1">
              {other && (
                <Link
                  href={`/u/${other.username || other.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors active:scale-[0.98]"
                >
                  <User className="h-4 w-4 text-[var(--os-muted)]" />
                  Voir le profil
                </Link>
              )}
              <button
                onClick={() => { haptic.medium(); setMenuOpen(false); alert("Signalement bientôt disponible."); }}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--os-fg)] hover:bg-[var(--os-bg)] transition-colors active:scale-[0.98]"
              >
                <ShieldAlert className="h-4 w-4 text-red-500" />
                Signaler
              </button>
              <div className="my-1 border-t border-[var(--os-card-border)]" />
              <button
                onClick={() => { haptic.medium(); setMenuOpen(false); alert("Suppression bientôt disponible."); }}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors active:scale-[0.98]"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer la conversation
              </button>
            </div>
          </BottomSheet>
        </div>
      </div>
    </div>
  );
}
