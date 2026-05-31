import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: { homeCity: true, activeCity: true },
  });

  if (!user) redirect("/login");

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Profile</h1>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-3">
        <p><span className="font-medium">Name:</span> {user.name || "-"}</p>
        <p><span className="font-medium">Username:</span> {user.username || "-"}</p>
        <p><span className="font-medium">Email:</span> {user.email}</p>
        <p><span className="font-medium">Bio:</span> {user.bio || "-"}</p>
        <p><span className="font-medium">Home city:</span> {user.homeCity?.name || "-"}</p>
        <p><span className="font-medium">Active city:</span> {user.activeCity?.name || "-"}</p>
        <p><span className="font-medium">Neighborhood:</span> {user.neighborhood || "-"}</p>
        <p><span className="font-medium">Language:</span> {user.language}</p>
        <p><span className="font-medium">Budget:</span> {user.preferredBudget || "-"}</p>
        <p><span className="font-medium">Verified:</span> {user.isVerified ? "Yes" : "No"}</p>
      </div>
    </div>
  );
}
