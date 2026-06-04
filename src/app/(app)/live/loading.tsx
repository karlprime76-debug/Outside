import { Skeleton } from "@/components/ui/skeleton";

export default function LiveLoading() {
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Skeleton className="h-4 w-24 rounded" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32 rounded" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-64 rounded" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="os-card p-4 flex items-start gap-3 animate-pulse">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
