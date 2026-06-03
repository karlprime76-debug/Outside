import React from "react";

interface OutsidePageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function OutsidePage({ children, className = "", ...rest }: OutsidePageProps) {
  return (
    <div
      className={
        `min-h-mobile bg-[var(--os-bg)] ${className}`
      }
      {...rest}
    >
      {children}
    </div>
  );
}
