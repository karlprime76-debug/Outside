import { db } from "@/lib/db";
import {
  extractHashtags,
  normalizeHashtag,
  isValidHashtag,
  limitHashtags
} from "./hashtag-utils";

/**
 * Crée ou récupère un hashtag et incrémente son compteur
 */
async function getOrCreateHashtag(
  tag: string,
  city?: string | null,
  countryCode?: string | null
) {
  const normalizedTag = normalizeHashtag(tag);
  if (!normalizedTag || !isValidHashtag(normalizedTag)) {
    return null;
  }

  const existing = city && countryCode
    ? await db.hashtag.findUnique({
        where: {
          tag_city_countryCode: {
            tag: normalizedTag,
            city,
            countryCode,
          },
        },
      })
    : await db.hashtag.findFirst({
        where: { tag: normalizedTag, city: city ?? null, countryCode: countryCode ?? null },
      });

  if (existing) {
    if (!existing.isBlocked) {
      await db.hashtag.update({
        where: { id: existing.id },
        data: {
          usageCount: { increment: 1 },
          momentUsageCount: { increment: 1 },
        },
      });
    }
    return existing;
  }

  return await db.hashtag.create({
    data: {
      tag: normalizedTag,
      displayName: tag, // Keep original formatting for display
      city: city || null,
      countryCode: countryCode || null,
      usageCount: 1,
      momentUsageCount: 1,
    },
  });
}

/**
 * Associe des hashtags à un Moment
 */
export async function attachHashtagsToMoment(
  momentId: string,
  caption: string | null,
  city?: string | null | undefined,
  countryCode?: string | null | undefined
) {
  if (!caption) return;

  // Extract and validate hashtags
  const extractedHashtags = extractHashtags(caption);
  const limitedHashtags = limitHashtags(extractedHashtags);

  if (limitedHashtags.length === 0) return;

  // Create or get hashtags and link them to the moment
  for (const tag of limitedHashtags) {
    const hashtag = await getOrCreateHashtag(tag, city || null, countryCode || null);
    if (!hashtag) continue;

    try {
      await db.momentHashtag.create({
        data: {
          momentId,
          hashtagId: hashtag.id,
        },
      });
    } catch (error) {
      // Ignore duplicate errors
      console.error(`[ATTACH_HASHTAGS] Error linking hashtag to moment:`, error);
    }
  }
}

/**
 * Associe des hashtags à un Plan
 */
export async function attachHashtagsToPlan(
  planId: string,
  description: string | null,
  city?: string | null | undefined,
  countryCode?: string | null | undefined
) {
  if (!description) return;

  // Extract and validate hashtags
  const extractedHashtags = extractHashtags(description);
  const limitedHashtags = limitHashtags(extractedHashtags);

  if (limitedHashtags.length === 0) return;

  // Create or get hashtags and link them to the plan
  for (const tag of limitedHashtags) {
    const hashtag = await getOrCreateHashtag(tag, city || null, countryCode || null);
    if (!hashtag) continue;

    try {
      await db.planHashtag.create({
        data: {
          planId,
          hashtagId: hashtag.id,
        },
      });

      // Increment plan usage count
      await db.hashtag.update({
        where: { id: hashtag.id },
        data: {
          usageCount: { increment: 1 },
          planUsageCount: { increment: 1 },
        },
      });
    } catch (error) {
      // Ignore duplicate errors
      console.error(`[ATTACH_HASHTAGS] Error linking hashtag to plan:`, error);
    }
  }
}

/**
 * Récupère les hashtags d'un Moment
 */
export async function getMomentHashtags(momentId: string) {
  const momentHashtags = await db.momentHashtag.findMany({
    where: { momentId },
    include: {
      hashtag: {
        select: {
          tag: true,
          displayName: true,
          isOfficial: true,
        },
      },
    },
  });

  return momentHashtags.map(mh => ({
    tag: mh.hashtag.tag,
    displayName: mh.hashtag.displayName || `#${mh.hashtag.tag}`,
    isOfficial: mh.hashtag.isOfficial,
  }));
}

/**
 * Récupère les hashtags d'un Plan
 */
export async function getPlanHashtags(planId: string) {
  const planHashtags = await db.planHashtag.findMany({
    where: { planId },
    include: {
      hashtag: {
        select: {
          tag: true,
          displayName: true,
          isOfficial: true,
        },
      },
    },
    take: 3, // Max 3 on cards
  });

  return planHashtags.map(ph => ({
    tag: ph.hashtag.tag,
    displayName: ph.hashtag.displayName || `#${ph.hashtag.tag}`,
    isOfficial: ph.hashtag.isOfficial,
  }));
}

/**
 * Supprime les associations hashtag d'un Moment (quand le Moment est supprimé)
 */
export async function detachHashtagsFromMoment(momentId: string) {
  await db.momentHashtag.deleteMany({
    where: { momentId },
  });
}

/**
 * Supprime les associations hashtag d'un Plan (quand le Plan est supprimé)
 */
export async function detachHashtagsFromPlan(planId: string) {
  await db.planHashtag.deleteMany({
    where: { planId },
  });
}
