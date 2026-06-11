import { db } from "@/lib/db";
import { ChallengeType, NotificationType } from "@prisma/client";
import { sendPushToUser } from "@/lib/push";
import { getLevelFromScore } from "@/lib/gamification";

/**
 * Moteur de Gamification pour gérer les quêtes et défis communautaires.
 */
export class GamificationEngine {
  /**
   * Incrémente la progression d'un utilisateur pour un type de défi spécifique.
   */
  static async trackAction(userId: string, type: ChallengeType, increment = 1) {
    try {
      // 1. Trouver tous les défis actifs de ce type (DailyChallenges & CityMissions)
      const [dailyChallenges, cityMissions] = await Promise.all([
        db.dailyChallenge.findMany({
          where: { type, active: true },
        }),
        db.cityMission.findMany({
          where: { type, active: true },
        }),
      ]);

      // 2. Mettre à jour la progression des défis quotidiens
      for (const challenge of dailyChallenges) {
        await this.updateChallengeProgress(userId, challenge.key, challenge.targetValue, increment, challenge.rewardPoints);
      }

      // 3. Mettre à jour la progression des missions de ville
      for (const mission of cityMissions) {
        await this.updateMissionProgress(userId, mission.key, mission.targetValue, increment, mission.rewardPoints);
      }
    } catch (error) {
      console.error("[GAMIFICATION_ENGINE_ERROR]", error);
    }
  }

  private static async updateChallengeProgress(userId: string, challengeKey: string, targetValue: number, increment: number, rewardPoints: number) {
    const progress = await db.userChallengeProgress.upsert({
      where: { userId_challengeKey: { userId, challengeKey } },
      create: { userId, challengeKey, currentValue: increment },
      update: { currentValue: { increment } },
    });

    // Si le défi vient d'être complété
    if (progress.currentValue >= targetValue && !progress.completedAt) {
      await db.userChallengeProgress.update({
        where: { id: progress.id },
        data: { completedAt: new Date() },
      });

      await this.rewardUser(userId, rewardPoints, NotificationType.CHALLENGE_COMPLETED, challengeKey);
    }
  }

  private static async updateMissionProgress(userId: string, missionKey: string, targetValue: number, increment: number, rewardPoints: number) {
    const progress = await db.userCityMissionProgress.upsert({
      where: { userId_missionKey: { userId, missionKey } },
      create: { userId, missionKey, currentValue: increment },
      update: { currentValue: { increment } },
    });

    if (progress.currentValue >= targetValue && !progress.completedAt) {
      await db.userCityMissionProgress.update({
        where: { id: progress.id },
        data: { completedAt: new Date() },
      });

      await this.rewardUser(userId, rewardPoints, NotificationType.MISSION_AVAILABLE, missionKey);
    }
  }

  private static async rewardUser(userId: string, points: number, notificationType: NotificationType, referenceKey: string) {
    // 0. Get old level
    const oldScoreData = await db.userQualityScore.findUnique({
      where: { userId },
      select: { score: true },
    });
    const oldScore = oldScoreData?.score ?? 50;
    const oldLevel = getLevelFromScore(oldScore).level;

    // 1. Booster le Quality Score
    const updatedScore = await db.userQualityScore.upsert({
      where: { userId },
      create: { userId, score: 50 + points / 10 },
      update: { score: { increment: points / 10 } },
    });

    const newLevel = getLevelFromScore(updatedScore.score).level;

    // 1.1 Trigger level up challenge if level increased
    if (newLevel > oldLevel) {
      await this.trackAction(userId, ChallengeType.REACH_LEVEL, newLevel - oldLevel).catch(err => 
        console.error("[GAMIFICATION_LEVEL_UP_ERROR]", err)
      );
    }

    // 2. Envoyer une notification
    await db.notification.create({
      data: {
        recipientId: userId,
        type: notificationType,
        title: "Défi réussi ! 🎉",
        body: `Tu as gagné ${points} points de réputation.`,
        data: JSON.stringify({ referenceKey }),
      },
    });

    // 3. Envoyer un push notification
    await sendPushToUser(userId, "system", {
      title: "Défi réussi ! 🎉",
      body: `Tu as gagné ${points} points de réputation.`,
      url: "/leaderboard",
    }).catch(err => console.error("[GAMIFICATION_PUSH_ERROR]", err));
  }
}
