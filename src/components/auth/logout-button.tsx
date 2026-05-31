"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
    >
      Sign out
    </button>
  );
}
