import { db } from "@/lib/db";
import { awardBadge, evaluateFounderBadges } from "@/lib/badges";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

import { buildReferralLink, getAppBaseUrl } from "@/lib/referral-share";

export { buildReferralLink, getAppBaseUrl };

export async function generateUniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const code = generateReferralCode();
    const [invite, user] = await Promise.all([
      db.referralInvite.findUnique({ where: { code }, select: { id: true } }),
      db.user.findFirst({ where: { referralCode: code }, select: { id: true } }),
    ]);
    if (!invite && !user) return code;
  }
  return `${generateReferralCode()}${Date.now().toString(36).slice(-2).toUpperCase()}`;
}

export async function ensureUserReferralCode(userId: string): Promise<{ code: string; referralLink: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  let code = user?.referralCode;
  if (!code) {
    code = await generateUniqueReferralCode();
    await db.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });
  }

  return { code, referralLink: buildReferralLink(code) };
}

export type ReferralInviter = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

export async function findInviterByCode(code: string): Promise<ReferralInviter | null> {
  const user = await db.user.findFirst({
    where: { referralCode: code },
    select: { id: true, name: true, username: true, image: true },
  });
  if (user) return user;

  const legacy = await db.referralInvite.findUnique({
    where: { code },
    include: {
      inviter: { select: { id: true, name: true, username: true, image: true } },
    },
  });
  return legacy?.inviter ?? null;
}

export async function getReferralStats(userId: string) {
  const accepted = await db.referralInvite.findMany({
    where: { inviterId: userId, acceptedAt: { not: null } },
    include: {
      acceptedUser: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
    orderBy: { acceptedAt: "desc" },
  });

  return {
    total: accepted.length,
    accepted: accepted.length,
    pending: 0,
    invites: accepted.map((i) => ({
      id: i.id,
      code: i.code,
      invitedEmail: i.invitedEmail,
      invitedPhone: i.invitedPhone,
      acceptedAt: i.acceptedAt,
      acceptedUser: i.acceptedUser,
      createdAt: i.createdAt,
    })),
  };
}

export async function awardReferralBadges(inviterId: string) {
  const count = await db.referralInvite.count({
    where: { inviterId, acceptedAt: { not: null } },
  });

  if (count >= 1) await awardBadge(inviterId, "FIRST_INVITE");
  if (count >= 3) await awardBadge(inviterId, "CIRCLE_LAUNCHER");
  if (count >= 5) await awardBadge(inviterId, "FIVE_INVITES");
  if (count >= 10) await awardBadge(inviterId, "LOCAL_AMBASSADOR");
}

export async function linkNewUserToReferral(
  referralCode: string,
  newUserId: string
): Promise<boolean> {
  const inviter = await findInviterByCode(referralCode);
  if (!inviter || inviter.id === newUserId) return false;

  const alreadyReferred = await db.referralInvite.findFirst({
    where: { acceptedUserId: newUserId },
  });
  if (alreadyReferred) return false;

  const legacy = await db.referralInvite.findUnique({
    where: { code: referralCode },
  });

  if (legacy && !legacy.acceptedAt && legacy.inviterId !== newUserId) {
    await db.referralInvite.update({
      where: { id: legacy.id },
      data: { acceptedUserId: newUserId, acceptedAt: new Date() },
    });
  } else {
    await db.referralInvite.create({
      data: {
        inviterId: inviter.id,
        code: await generateUniqueReferralCode(),
        acceptedUserId: newUserId,
        acceptedAt: new Date(),
      },
    });
  }

  await awardReferralBadges(inviter.id);
  const referredBadge = await awardBadge(newUserId, "REFERRED_BY_FRIEND");
  if (!referredBadge) await awardBadge(newUserId, "new_outside");
  evaluateFounderBadges(newUserId).catch((err) => { console.error("[MOMENT_ERROR] Failed to evaluate founder badges:", err); });
  return true;
}

export async function acceptReferralForUser(
  referralCode: string,
  userId: string
): Promise<{ ok: boolean; error?: string; alreadyLinked?: boolean }> {
  const alreadyReferred = await db.referralInvite.findFirst({
    where: { acceptedUserId: userId },
  });
  if (alreadyReferred) {
    return { ok: true, alreadyLinked: true };
  }

  const linked = await linkNewUserToReferral(referralCode, userId);
  if (!linked) return { ok: false, error: "Impossible d'accepter ce parrainage." };
  return { ok: true };
}

