import Link from "next/link";

export const metadata = {
  title: "Mentions légales · OUTSIDE",
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--os-bg)]">
      <header className="sticky top-0 z-40 border-b border-[var(--os-card-border)] bg-[var(--os-bg)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-black gradient-text">OUTSIDE</Link>
          <Link href="/" className="text-sm font-semibold text-[var(--os-muted)] hover:text-[var(--os-fg)] transition-colors">Accueil</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-4 md:p-6 space-y-8">
        {children}
      </main>
      <footer className="border-t border-[var(--os-card-border)] py-8 text-center text-xs text-[var(--os-muted)]">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link href="/legal/terms" className="hover:text-[var(--os-fg)]">Conditions</Link>
            <Link href="/legal/privacy" className="hover:text-[var(--os-fg)]">Confidentialité</Link>
            <Link href="/legal/community-guidelines" className="hover:text-[var(--os-fg)]">Règles</Link>
            <Link href="/legal/cookies" className="hover:text-[var(--os-fg)]">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
