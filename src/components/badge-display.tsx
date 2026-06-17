"use client";

interface Badge {
  id: string;
  key: string;
  name: string;
  description?: string;
  icon?: string;
}

interface BadgeDisplayProps {
  badges: Badge[];
  size?: "sm" | "md" | "lg";
  max?: number;
}

export function BadgeDisplay({ badges, size = "md", max = 5 }: BadgeDisplayProps) {
  if (!badges || badges.length === 0) return null;

  const displayedBadges = badges.slice(0, max);
  const hiddenCount = Math.max(0, badges.length - max);

  const sizeClass = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }[size];

  return (
    <div className="flex items-center gap-1">
      {displayedBadges.map((badge) => (
        <div
          key={badge.id}
          className={`${sizeClass} bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs cursor-help`}
          title={badge.name}
        >
          {badge.icon ? (
            <span>{badge.icon}</span>
          ) : (
            <span>{badge.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
      ))}

      {hiddenCount > 0 && (
        <div
          className={`${sizeClass} bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-xs cursor-help`}
          title={`+${hiddenCount} more badges`}
        >
          +{hiddenCount}
        </div>
      )}
    </div>
  );
}

export function BadgeRow({ badges }: { badges: Badge[] }) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="space-y-2">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {badge.icon ? <span>{badge.icon}</span> : <span>{badge.name.charAt(0).toUpperCase()}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900">{badge.name}</p>
            {badge.description && <p className="text-xs text-gray-600">{badge.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
