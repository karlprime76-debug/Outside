import { db } from "@/lib/db";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  isToday: boolean;
}

export async function getStreak(userId: string): Promise<StreakData> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastActiveDate: true },
  });

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const lastActive = user?.lastActiveDate;
  const isToday = lastActive
    ? lastActive.toISOString().split("T")[0] === todayStr
    : false;

  return {
    currentStreak: user?.currentStreak ?? 0,
    longestStreak: user?.longestStreak ?? 0,
    lastActiveDate: user?.lastActiveDate?.toISOString() ?? null,
    isToday,
  };
}

export async function updateStreak(userId: string): Promise<StreakData> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastActiveDate: true },
  });

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const lastActive = user?.lastActiveDate;
  const lastStr = lastActive ? lastActive.toISOString().split("T")[0] : null;

  let newStreak = user?.currentStreak ?? 0;
  let newLongest = user?.longestStreak ?? 0;

  if (lastStr === todayStr) {
    // Already active today, no change needed
  } else {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (lastStr === yesterdayStr) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    if (newStreak > newLongest) {
      newLongest = newStreak;
    }

    await db.user.update({
      where: { id: userId },
      data: {
        lastActiveDate: today,
        currentStreak: newStreak,
        longestStreak: newLongest,
      },
    });
  }

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActiveDate: today.toISOString(),
    isToday: true,
  };
}
