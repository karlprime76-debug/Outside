"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Se déconnecter</span>
    </button>
  );
}
