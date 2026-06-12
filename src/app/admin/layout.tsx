import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "./admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") redirect("/home");

  return (
    <div className="flex min-h-screen">
      <AdminSidebar role={session.user.role} />
      <main className="flex-1 min-w-0 p-4 lg:p-6">{children}</main>
    </div>
  );
}
