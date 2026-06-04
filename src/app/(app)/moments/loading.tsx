export default function MomentsLoading() {
  return (
    <div className="flex flex-col h-[100dvh] sm:h-auto sm:min-h-[100dvh]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--os-card-border)]">
        <div className="h-6 w-32 bg-[var(--os-card)] shimmer rounded" />
        <div className="h-9 w-9 rounded-full bg-[var(--os-card)] shimmer" />
      </div>
      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 border-b border-[var(--os-card-border)]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-20 bg-[var(--os-card)] shimmer rounded-full" />
        ))}
      </div>
      {/* Cards */}
      <div className="flex-1 overflow-hidden p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="os-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[var(--os-bg)] shimmer" />
              <div className="space-y-1.5">
                <div className="h-4 w-24 bg-[var(--os-bg)] shimmer rounded" />
                <div className="h-3 w-16 bg-[var(--os-bg)] shimmer rounded" />
              </div>
            </div>
            <div className="aspect-[4/5] rounded-xl bg-[var(--os-bg)] shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
