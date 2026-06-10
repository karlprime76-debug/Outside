import { Globe, Instagram, Twitter, Music2, Github } from "lucide-react";

interface SocialLink {
  platform: string;
  url: string;
  label: string;
}

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  website: Globe,
  instagram: Instagram,
  twitter: Twitter,
  tiktok: Music2,
  github: Github,
  youtube: Globe,
  linkedin: Globe,
};

export function ProfileSocialLinks({ socialLinks }: { socialLinks: string | null }) {
  if (!socialLinks) return null;

  let links: SocialLink[];
  try {
    links = JSON.parse(socialLinks);
    if (!Array.isArray(links) || links.length === 0) return null;
  } catch {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 animate-slide-up">
      {links.map((link, i) => {
        const Icon = PLATFORM_ICONS[link.platform] || Globe;
        return (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--os-card-border)] bg-[var(--os-card)] px-3 py-1.5 text-xs font-semibold text-[var(--os-fg)] hover:border-outside-300 hover:text-outside-600 transition-colors"
          >
            <Icon className="h-3.5 w-3.5" />
            {link.label}
          </a>
        );
      })}
    </div>
  );
}
