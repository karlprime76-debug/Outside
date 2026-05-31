import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const [usersCount, plansCount, placesCount, reportsCount] = await Promise.all([
    db.user.count(),
    db.plan.count(),
    db.place.count(),
    db.report.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Users</p>
          <p className="text-2xl font-bold text-zinc-900">{usersCount}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Plans</p>
          <p className="text-2xl font-bold text-zinc-900">{plansCount}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Places</p>
          <p className="text-2xl font-bold text-zinc-900">{placesCount}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Pending Reports</p>
          <p className="text-2xl font-bold text-red-600">{reportsCount}</p>
        </div>
      </div>
    </div>
  );
}
