import { SkeletonCard } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="space-y-8 p-4 max-w-5xl mx-auto pb-24 md:pb-4 pt-safe md:pt-0">
      {/* Hero */}
      <div className="os-card p-6 h-40 shimmer rounded-2xl" />

      {/* Lives */}
      <div>
        <div className="h-6 w-32 bg-[var(--os-card)] shimmer rounded mb-3" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[200px] flex-shrink-0 os-card p-4 h-28 shimmer rounded-xl" />
          ))}
        </div>
      </div>

      {/* Events */}
      <div>
        <div className="h-6 w-32 bg-[var(--os-card)] shimmer rounded mb-3" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[200px] flex-shrink-0 os-card p-4 h-28 shimmer rounded-xl" />
          ))}
        </div>
      </div>

      {/* Moments */}
      <div>
        <div className="h-6 w-32 bg-[var(--os-card)] shimmer rounded mb-3" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[140px] flex-shrink-0 aspect-[3/4] rounded-2xl bg-[var(--os-bg)] shimmer" />
          ))}
        </div>
      </div>

      {/* Plans */}
      <div>
        <div className="h-6 w-32 bg-[var(--os-card)] shimmer rounded mb-3" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>

      {/* Places */}
      <div>
        <div className="h-6 w-32 bg-[var(--os-card)] shimmer rounded mb-3" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[180px] flex-shrink-0 os-card p-4 h-28 shimmer rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
