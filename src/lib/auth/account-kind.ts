import { getCurrentUser } from "./session";

/**
 * Middleware-like permission check for API routes.
 * Future use: when accountKind-restricted features are built,
 * import this in route handlers to enforce access.
 *
 * Example:
 *   const { allowed, error } = await requireAccountKind(["OFFICIAL_CITY", "OFFICIAL_GUIDE"]);
 *   if (!allowed) return NextResponse.json({ error }, { status: 403 });
 */
export async function requireAccountKind(requiredKinds: string[]): Promise<{ allowed: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { allowed: false, error: "Non autorisé" };
  if (requiredKinds.length > 0 && !requiredKinds.includes(user.accountKind)) {
    return { allowed: false, error: "Accès refusé" };
  }
  return { allowed: true };
}
