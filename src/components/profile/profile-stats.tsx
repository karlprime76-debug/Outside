import Link from "next/link";

interface Stats {
  momentsCount: number;
  friendsCount: number;
  followersCount: number;
  plansCount: number;
}

export function ProfileStats({ momentsCount, friendsCount, followersCount, plansCount }: Stats) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up">
      <Link href="/moments" className="os-card p-5 text-center block hover:border-outside-300 transition-colors">
        <p className="text-2xl font-black text-outside-600">{momentsCount}</p>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">Moments</p>
      </Link>
      <Link href="/friends" className="os-card p-5 text-center block hover:border-outside-300 transition-colors">
        <p className="text-2xl font-black text-outside-600">{friendsCount}</p>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">Amis</p>
      </Link>
      <div className="os-card p-5 text-center">
        <p className="text-2xl font-black text-outside-600">{followersCount}</p>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">Abonnés</p>
      </div>
      <Link href="/plans" className="os-card p-5 text-center block hover:border-outside-300 transition-colors">
        <p className="text-2xl font-black text-outside-600">{plansCount}</p>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--os-muted)]">Plans</p>
      </Link>
    </div>
  );
}
