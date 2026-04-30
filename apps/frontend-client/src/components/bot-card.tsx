import { Bot, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";

interface BotCardProps {
  name: string;
  description: string;
  roi: number;
  maxDrawdown: number;
  riskLevel: string;
  strategy: string;
  onActivate?: () => void;
}

export function BotCard({
  name,
  description,
  roi,
  maxDrawdown,
  riskLevel,
  strategy,
  onActivate,
}: BotCardProps) {
  const roiPositive = roi >= 0;
  const riskType = riskLevel === "Faible" ? "profit" : riskLevel === "Moyen" ? "risk" : "loss";

  return (
    <div className="card-trader group hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start gap-4 mb-4">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
          <Bot className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{name}</h3>
          <p className="caption">{strategy}</p>
        </div>
        <StatusBadge type={roiPositive ? "profit" : "loss"}>
          {roiPositive ? "+" : ""}{roi}%
        </StatusBadge>
      </div>

      <p className="text-sm text-soft-text mb-4">{description}</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="caption mb-1">ROI 30j</p>
          <p className="text-lg font-bold tnum flex items-center gap-1">
            {roiPositive ? "+" : ""}{roi}%
            <TrendingUp className="h-4 w-4 text-success" />
          </p>
        </div>
        <div>
          <p className="caption mb-1">Max DD</p>
          <p className="text-lg font-bold tnum text-destructive">
            {maxDrawdown}%
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-soft-text">Niveau de risque</span>
        <StatusBadge type={riskType}>{riskLevel}</StatusBadge>
      </div>

      <Button
        variant="default"
        size="default"
        className="w-full"
        onClick={() => {
          if (onActivate) onActivate();
          window.location.href = "/bot/1";
        }}
      >
        Voir détails
      </Button>
    </div>
  );
}
