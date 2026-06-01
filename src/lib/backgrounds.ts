export const backgrounds = {
  landing: {
    day: "/backgrounds/landing-day.webp",
    night: "/backgrounds/landing-night.webp",
  },
  auth: {
    register: "/backgrounds/auth-register.webp",
    login: "/backgrounds/auth-login.webp",
  },
  home: {
    day: "/backgrounds/home-day.webp",
    night: "/backgrounds/home-night.webp",
  },
  plans: {
    day: "/backgrounds/plans-night.webp",
    night: "/backgrounds/plans-night.webp",
  },
  passport: {
    day: "/backgrounds/passport-day.webp",
    night: "/backgrounds/passport-night.webp",
  },
} as const;

export function getThemedBackground(
  section: keyof typeof backgrounds,
  theme: "day" | "night"
): string {
  const cfg = backgrounds[section] as Record<string, string>;
  if (section === "auth") {
    return cfg.login;
  }
  return theme === "night" ? cfg.night : cfg.day;
}
