import { db } from "@/lib/db";

export async function getUserBlockedIds(userId: string): Promise<string[]> {
  const blocks = await db.userBlock.findMany({
    where: { blockerId: userId },
    select: { blockedId: true },
  });
  return blocks.map((b) => b.blockedId);
}

export async function getUserBlockedByUserIds(userId: string): Promise<string[]> {
  const blocks = await db.userBlock.findMany({
    where: { blockedId: userId },
    select: { blockerId: true },
  });
  return blocks.map((b) => b.blockerId);
}
