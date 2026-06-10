"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      title="Se déconnecter"
      className="inline-flex items-center justify-center rounded-lg p-2 text-sm font-medium text-[var(--os-muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
