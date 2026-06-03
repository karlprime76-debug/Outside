import React from "react";

interface OutsideHeaderProps {
  title: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
  sticky?: boolean;
}

export function OutsideHeader({ title, right, left, sticky = true }: OutsideHeaderProps) {
  return (
    <div className={(sticky ? "sticky top-0 z-40 " : "") + "flex items-center justify-between border-b border-[var(--os-card-border)] bg-[var(--os-bg)]/90 backdrop-blur-md px-4 py-3"}>
      <div className="flex items-center gap-2">
        {left}
        <h1 className="text-lg font-black text-[var(--os-fg)]">{title}</h1>
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
