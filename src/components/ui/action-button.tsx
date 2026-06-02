import { type ReactNode } from "react";
import Link from "next/link";

interface ActionButtonProps {
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function ActionButton({
  href,
  onClick,
  variant = "primary",
  size = "md",
  icon,
  children,
  className = "",
  disabled = false,
}: ActionButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all press disabled:opacity-50";

  const variants = {
    primary:
      "bg-gradient-to-r from-outside-500 to-accent-500 text-white shadow-glow hover:shadow-glow-lg",
    secondary:
      "border-2 border-[var(--os-card-border)] bg-[var(--os-card)] text-[var(--os-fg)] hover:border-outside-300 hover:bg-outside-50/50",
    ghost:
      "bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/10",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={classes}>
      {icon}
      {children}
    </button>
  );
}
