import React from "react";

export function OutsideCard({ className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={"os-card rounded-2xl hover-lift card-hover " + className}
      {...rest}
    />
  );
}
