export default function PublicProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto p-4 pb-24 md:pb-4 space-y-6">
      {/* Header avatar + name */}
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-[var(--os-card)] shimmer" />
        <div className="space-y-2">
          <div className="h-6 w-40 bg-[var(--os-card)] shimmer rounded" />
          <div className="h-4 w-24 bg-[var(--os-card)] shimmer rounded" />
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="os-card p-3 space-y-2">
            <div className="h-5 w-8 bg-[var(--os-bg)] shimmer rounded mx-auto" />
            <div className="h-3 w-16 bg-[var(--os-bg)] shimmer rounded mx-auto" />
          </div>
        ))}
      </div>
      {/* Actions */}
      <div className="flex gap-2">
        <div className="h-10 flex-1 bg-[var(--os-card)] shimmer rounded-xl" />
        <div className="h-10 flex-1 bg-[var(--os-card)] shimmer rounded-xl" />
      </div>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--os-card-border)] pb-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 bg-[var(--os-card)] shimmer rounded-full" />
        ))}
      </div>
      {/* Content */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square rounded-xl bg-[var(--os-card)] shimmer" />
        ))}
      </div>
    </div>
  );
}
