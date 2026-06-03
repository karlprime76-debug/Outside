import Link from "next/link";
import { ArrowLeft, UserX } from "lucide-react";

export default function PublicProfileNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--os-card-border)]/40">
        <UserX className="h-8 w-8 text-[var(--os-muted)]" />
      </div>
      <h1 className="mb-2 text-xl font-black text-[var(--os-fg)]">
        Profil introuvable
      </h1>
      <p className="mb-6 max-w-xs text-sm text-[var(--os-muted)]">
        Ce profil n&apos;existe pas ou a été supprimé.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-outside-500 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
