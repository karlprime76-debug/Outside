export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto p-4 pb-24 md:pb-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[var(--os-card)] shimmer" />
        <div className="space-y-1.5">
          <div className="h-5 w-40 bg-[var(--os-card)] shimmer rounded" />
          <div className="h-3 w-24 bg-[var(--os-card)] shimmer rounded" />
        </div>
      </div>
      {/* Sections */}
      {[1, 2, 3, 4].map((section) => (
        <div key={section} className="os-card p-4 space-y-4">
          <div className="h-5 w-32 bg-[var(--os-bg)] shimmer rounded" />
          {[1, 2, 3].map((row) => (
            <div key={row} className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-4 w-40 bg-[var(--os-bg)] shimmer rounded" />
                <div className="h-3 w-56 bg-[var(--os-bg)] shimmer rounded" />
              </div>
              <div className="h-6 w-10 bg-[var(--os-bg)] shimmer rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
