import Link from "next/link";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-outside-700">
            OUTSIDE
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-zinc-600">
            <Link href="/plans" className="hover:text-zinc-900">Plans</Link>
            <Link href="/places" className="hover:text-zinc-900">Places</Link>
            <Link href="/passport" className="hover:text-zinc-900">Passport</Link>
            <Link href="/profile" className="hover:text-zinc-900">Profile</Link>
            {session?.user ? (
              <LogoutButton />
            ) : (
              <Link href="/login" className="hover:text-zinc-900">Sign in</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
