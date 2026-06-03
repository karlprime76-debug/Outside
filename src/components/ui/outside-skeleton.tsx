import React from "react";

export function OutsideSkeleton({ className = "h-10 w-full" }: { className?: string }) {
  return <div className={`rounded-xl shimmer ${className}`} />;
}
