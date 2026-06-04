export default function DmLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Search */}
      <div className="h-10 w-full bg-[var(--os-card)] shimmer rounded-xl" />
      {/* Items */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--os-card-border)] bg-[var(--os-card)] px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-[var(--os-bg)] shimmer shrink-0" />
            <div className="space-y-1.5 min-w-0">
              <div className="h-4 w-32 bg-[var(--os-bg)] shimmer rounded" />
              <div className="h-3 w-48 bg-[var(--os-bg)] shimmer rounded" />
            </div>
          </div>
          <div className="h-4 w-4 bg-[var(--os-bg)] shimmer rounded shrink-0" />
        </div>
      ))}
    </div>
  );
}
