export const REFERRAL_SHARE_TEXT =
  "Rejoins-moi sur OUTSIDE ! Plus ton cercle est dehors, plus OUTSIDE devient vivant.";

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    "https://outside-tau.vercel.app"
  ).replace(/\/$/, "");
}

export function buildReferralLink(code: string): string {
  return `${getAppBaseUrl()}/invite/${code}`;
}

export function buildWhatsAppShareUrl(link: string, message = REFERRAL_SHARE_TEXT): string {
  return `https://wa.me/?text=${encodeURIComponent(`${message} ${link}`)}`;
}

export function buildPlanShareText(planTitle: string, link: string): string {
  return `Tu viens ? J'organise "${planTitle}" sur OUTSIDE : ${link}`;
}
