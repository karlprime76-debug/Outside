export function generateReferralCode(userId: string): string {
  // Generate a short, unique code from user ID
  const hash = userId.split("-")[0];
  const random = Math.random().toString(36).substring(2, 6);
  return `${hash}${random}`.toUpperCase();
}
