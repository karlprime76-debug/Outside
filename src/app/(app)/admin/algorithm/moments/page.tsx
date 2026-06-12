import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminAlgorithmMomentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const moments = await db.moment.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, username: true } },
    },
  });

  const momentIds = moments.map((m) => m.id);
  const momentScores = await db.momentScore.findMany({
    where: { momentId: { in: momentIds } },
  });
  const scoreMap = new Map(momentScores.map((s) => [s.momentId, s]));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Algorithm Debug - Moments</h1>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Author</th>
              <th className="text-left p-2">Score</th>
              <th className="text-left p-2">Viral</th>
              <th className="text-left p-2">Local</th>
              <th className="text-left p-2">Audience</th>
              <th className="text-left p-2">Impressions</th>
              <th className="text-left p-2">Views</th>
              <th className="text-left p-2">Completion</th>
              <th className="text-left p-2">DM Shares</th>
              <th className="text-left p-2">Reports</th>
            </tr>
          </thead>
          <tbody>
            {moments.map((moment) => {
              const score = scoreMap.get(moment.id);
              return (
                <tr key={moment.id} className="border-b">
                  <td className="p-2 font-mono text-xs">{moment.id.slice(0, 8)}</td>
                  <td className="p-2">{moment.author.username}</td>
                  <td className="p-2">{score?.score.toFixed(2) || "N/A"}</td>
                  <td className="p-2">{score?.viralScore.toFixed(2) || "N/A"}</td>
                  <td className="p-2">{score?.localScore.toFixed(2) || "N/A"}</td>
                  <td className="p-2">{score?.audienceLevel || 0}</td>
                  <td className="p-2">{score?.impressions || 0}</td>
                  <td className="p-2">{score?.views || 0}</td>
                  <td className="p-2">{score?.completions || 0}</td>
                  <td className="p-2">{(score as { dmShares?: number })?.dmShares || 0}</td>
                  <td className="p-2">{score?.reports || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
