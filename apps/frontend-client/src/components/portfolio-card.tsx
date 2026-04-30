import { TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

interface PortfolioCardProps {
  title: string;
  balance: number;
  change: number;
  subtitle?: string;
}

export function PortfolioCard({
  title,
  balance,
  change,
  subtitle,
}: PortfolioCardProps) {
  const isPositive = change >= 0;

  return (
    <div className="card-portfolio">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="caption mb-1">{title}</p>
          {subtitle && <p className="text-xs text-soft-text">{subtitle}</p>}
        </div>
        <StatusBadge type={isPositive ? "profit" : "loss"}>
          {isPositive ? "+" : ""}{change}%
        </StatusBadge>
      </div>
      
      <div className="flex items-baseline gap-2">
        <h2 className="text-3xl font-bold tnum">${balance.toLocaleString()}</h2>
        <div className="flex items-center gap-1 text-sm">
          <TrendingUp
            className={`h-4 w-4 ${isPositive ? "text-success" : "text-destructive rotate-180"}`}
          />
          <span className={isPositive ? "text-success" : "text-destructive"}>
            ${Math.abs(change * balance / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
