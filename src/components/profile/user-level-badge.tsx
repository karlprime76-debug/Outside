import { getLevelFromScore } from "@/lib/gamification";

interface Props {
  score: number;
  showName?: boolean;
}

export function UserLevelBadge({ score, showName = true }: Props) {
  const level = getLevelFromScore(score);
  
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg`}>
      <div className={`flex h-5 w-5 items-center justify-center rounded-full bg-${level.color}-500 text-white text-[10px] font-black shadow-glow`}>
        {level.level}
      </div>
      {showName && (
        <span className="text-[10px] font-black uppercase tracking-wider text-white">
          {level.name}
        </span>
      )}
    </div>
  );
}
