import { useNavigate } from "react-router-dom";
import { TrendingUp, Users } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface TraderCardProps {
  id?: string; // Add ID prop
  name: string;
  avatar?: string;
  roi: number;
  maxDrawdown: number;
  followers: number;
  style: string;
  onCopy?: () => void;
}

export function TraderCard({
  id,
  name,
  avatar,
  roi,
  maxDrawdown,
  followers,
  style,
  onCopy,
}: TraderCardProps) {
  const navigate = useNavigate();
  const roiPositive = roi >= 0;

  return (
    <div className="card-trader group hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="h-14 w-14 border-2 border-border">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{name}</h3>
          <p className="caption">{style}</p>
        </div>
        <StatusBadge type={roiPositive ? "profit" : "loss"}>
          {roiPositive ? "+" : ""}{roi}%
        </StatusBadge>
      </div>

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

      <div className="flex items-center gap-2 mb-4 text-soft-text">
        <Users className="h-4 w-4" />
        <span className="text-sm tnum">{followers.toLocaleString()} followers</span>
      </div>

      <Button
        variant="default"
        size="default"
        className="w-full"
        onClick={(e) => {
          e.stopPropagation(); // Prevent opening profile
          if (onCopy) {
            onCopy();
          } else if (id) {
            navigate("/copy-config", { state: { masterId: id } });
          }
        }}
      >
        Copier ce trader
      </Button>
    </div>
  );
}
