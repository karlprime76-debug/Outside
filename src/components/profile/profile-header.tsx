import { ProfileAvatarViewer } from "./profile-avatar-viewer";
import { MapPin, Camera } from "lucide-react";
import Link from "next/link";
import { UserLevelBadge } from "./user-level-badge";

interface ProfileHeaderUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  coverImage: string | null;
  bio: string | null;
  homeCity: { name: string } | null;
  activeCity: { name: string } | null;
  isVerified: boolean;
}

interface Props {
  user: ProfileHeaderUser;
  qualityScore?: number;
  showCity?: boolean;
  actions?: React.ReactNode;
  isOwn?: boolean;
}

export function ProfileHeader({ user, qualityScore, showCity = true, actions, isOwn }: Props) {
  const cityName = user.activeCity?.name || user.homeCity?.name;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-outside-500 via-outside-600 to-accent-600 text-white shadow-glow animate-fade-in">
      {user.coverImage ? (
        <>
          <img
            src={user.coverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </>
      ) : null}
      <div className="relative z-10 p-6">
        <div className="flex items-center gap-4">
          <ProfileAvatarViewer src={user.image} name={user.name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-1">
              {qualityScore !== undefined && (
                <div className="mb-1">
                  <UserLevelBadge score={qualityScore} />
                </div>
              )}
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black truncate">{user.name || "Utilisateur OUTSIDE"}</h1>
                {isOwn && (
                  <Link
                    href="/profile/edit"
                    className="shrink-0 rounded-full bg-white/20 p-1.5 hover:bg-white/30 transition-colors"
                    aria-label="Modifier"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
            <p className="text-sm text-white/80 truncate">@{user.username || "username"}</p>
            {showCity && cityName && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-white/70">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{cityName}</span>
              </div>
            )}
            {actions && <div className="mt-3 flex items-center gap-2 flex-wrap">{actions}</div>}
          </div>
        </div>
      </div>
      {!user.coverImage && <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />}
    </div>
  );
}
