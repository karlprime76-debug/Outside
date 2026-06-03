const RESERVED = new Set([
  "admin",
  "support",
  "outside",
  "official",
  "login",
  "register",
  "settings",
  "profile",
  "api",
  "legal",
  "moments",
  "live",
  "plans",
  "dm",
]);

export function normalizeUsername(value: unknown): string {
  const raw = String(value ?? "").trim();
  const withoutAt = raw.startsWith("@") ? raw.slice(1) : raw;
  return withoutAt.toLowerCase();
}

export function isReservedUsername(value: string): boolean {
  return RESERVED.has(value);
}

export function validateUsername(value: unknown): { ok: true } | { ok: false; error: string } {
  const u = normalizeUsername(value);
  if (!u) return { ok: false, error: "Nom d’utilisateur trop court." };
  if (u.length < 3) return { ok: false, error: "Nom d’utilisateur trop court." };
  if (u.length > 24) return { ok: false, error: "Nom d’utilisateur trop long." };
  // Only letters, numbers, underscore, dot
  if (!/^[a-z0-9._]+$/.test(u)) {
    return { ok: false, error: "Utilise seulement lettres, chiffres, points ou underscores." };
  }
  if (u.includes("..")) return { ok: false, error: "Utilise seulement lettres, chiffres, points ou underscores." };
  if (u.startsWith(".") || u.endsWith(".")) return { ok: false, error: "Utilise seulement lettres, chiffres, points ou underscores." };
  if (isReservedUsername(u)) return { ok: false, error: "Ce nom d’utilisateur est réservé." };
  return { ok: true };
}
