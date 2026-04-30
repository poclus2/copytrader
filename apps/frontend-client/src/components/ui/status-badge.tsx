import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  type: "profit" | "loss" | "risk" | "neutral";
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ type, children, className }: StatusBadgeProps) {
  const variants = {
    profit: "status-profit",
    loss: "status-loss",
    risk: "status-risk",
    neutral: "status-neutral",
  };

  return (
    <span className={cn(variants[type], className)}>
      {children}
    </span>
  );
}
