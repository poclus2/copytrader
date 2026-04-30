import React from 'react';
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PerformanceChart } from "@/components/performance-chart";
import {
  TrendingUp,
  Users,
  Calendar,
  Target,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useMaster, useMasterTrades, useMasterPerformance } from "@/hooks/useMasters";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("TraderProfile Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-500">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <pre className="bg-gray-100 p-4 rounded text-left overflow-auto text-sm text-black">
            {this.state.error?.toString()}
          </pre>
          <Button onClick={() => window.location.reload()} className="mt-4">Reload Page</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

const TraderProfileContent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: master, isLoading: isLoadingMaster } = useMaster(id!);
  const { data: tradesData, isLoading: isLoadingTrades } = useMasterTrades(id!);
  const { data: performance } = useMasterPerformance(id!);

  const isLoading = isLoadingMaster || isLoadingTrades;

  const trader = {
    name: master?.name || "Loading...",
    style: master?.description || "Day Trading",
    roi: master?.stats?.roi30d || 0,
    maxDrawdown: master?.stats?.drawdown || 0,
    winRate: master?.stats?.winRate || 0,
    followers: master?.stats?.subscribers || 0,
    totalTrades: master?.stats?.totalTrades || 0,
    avgProfit: master?.stats?.avgWin || 0,
    riskScore: master?.riskLevel === 'high' ? 8 : master?.riskLevel === 'medium' ? 5 : 2,
    since: "Jan 2023", // TODO: Add to backend
  };

  if (isLoading) return <div className="p-6 text-center">Chargement...</div>;

  const openPositions = (tradesData?.data || []).filter(t => !t.closeTime).map(t => ({
    pair: t.symbol,
    type: t.type,
    lot: Number(t.volume),
    profit: Number(t.profit) || 0,
    pips: 0, // TODO: Calculate pips
  }));

  const tradeHistory = (tradesData?.data || []).filter(t => t.closeTime).map(t => ({
    pair: t.symbol,
    type: t.type,
    profit: Number(t.profit) || 0,
    date: new Date(t.closeTime!).toLocaleDateString(),
    time: new Date(t.closeTime!).toLocaleTimeString(),
  }));

  // Transform backend performance data for the chart if available
  const performanceChartData = (performance?.monthlyReturns || []).map((item: any) => ({
    date: item.month,
    value: item.return // This is just monthly return, ideally we need cumulative equity
  }));

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-10 backdrop-blur-lg bg-card/95">
        <div className="p-6 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-soft-text hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Retour</span>
          </button>

          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src="" alt={trader.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                {trader.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{trader.name}</h1>
                <StatusBadge type="profit">Vérifié</StatusBadge>
              </div>
              <p className="text-soft-text mb-3">{trader.style}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-soft-text">
                  <Users className="h-4 w-4" />
                  <span className="tnum">{trader.followers}</span>
                </div>
                <div className="flex items-center gap-1.5 text-soft-text">
                  <Calendar className="h-4 w-4" />
                  <span>Depuis {trader.since}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-3 gap-3 p-6 pt-0">
          <div className="card-trader text-center flex flex-col justify-center">
            <p className="caption mb-1">ROI 30j</p>
            <p className="text-xl font-bold tnum text-success">+{trader.roi}%</p>
          </div>
          <div className="card-trader text-center flex flex-col justify-center">
            <p className="caption mb-1">Win Rate</p>
            <p className="text-xl font-bold tnum">{trader.winRate}%</p>
          </div>
          <div className="card-trader text-center flex flex-col justify-center">
            <p className="caption mb-1">Max DD</p>
            <p className="text-xl font-bold tnum text-destructive">{trader.maxDrawdown}%</p>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6 animate-fade-in">
        {/* Performance Chart */}
        <section className="card-portfolio">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Equity Curve
            </h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs rounded-full bg-primary text-primary-foreground">
                30J
              </button>
              <button className="px-3 py-1 text-xs rounded-full bg-muted text-soft-text">
                90J
              </button>
              <button className="px-3 py-1 text-xs rounded-full bg-muted text-soft-text">
                1A
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-border p-4 bg-background/50">
            {/* Pass undefined to use mock data until backend provides cumulative equity */}
            <PerformanceChart />
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="card-trader">
            <Target className="h-5 w-5 text-primary mb-2" />
            <p className="caption mb-1">Trades Total</p>
            <p className="text-2xl font-bold tnum">{trader.totalTrades}</p>
          </div>
          <div className="card-trader">
            <TrendingUp className="h-5 w-5 text-success mb-2" />
            <p className="caption mb-1">Profit Moyen</p>
            <p className="text-2xl font-bold tnum text-success">+{trader.avgProfit}%</p>
          </div>
          <div className="card-trader">
            <Shield className="h-5 w-5 text-warning mb-2" />
            <p className="caption mb-1">Score Risque</p>
            <p className="text-2xl font-bold tnum">{trader.riskScore}/10</p>
          </div>
          <div className="card-trader">
            <Users className="h-5 w-5 text-primary mb-2" />
            <p className="caption mb-1">Copieurs</p>
            <p className="text-2xl font-bold tnum">{trader.followers}</p>
          </div>
        </section>

        {/* Open Positions */}
        <section className="space-y-4">
          <h3 className="text-foreground">Positions Ouvertes ({openPositions.length})</h3>
          <div className="space-y-3">
            {openPositions.length === 0 ? (
              <p className="text-soft-text text-sm">Aucune position ouverte.</p>
            ) : (
              openPositions.map((position, index) => (
                <div key={index} className="card-trader flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{position.pair}</p>
                      <StatusBadge type={position.type === "BUY" ? "profit" : "loss"}>
                        {position.type}
                      </StatusBadge>
                    </div>
                    <p className="caption">Lot: {position.lot} • {position.pips > 0 ? "+" : ""}{position.pips} pips</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold tnum ${position.profit > 0 ? "text-success" : "text-destructive"}`}>
                      {position.profit > 0 ? "+" : ""}${position.profit.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Trade History */}
        <section className="space-y-4">
          <h3 className="text-foreground">Historique des Trades</h3>
          <div className="space-y-3">
            {tradeHistory.length === 0 ? (
              <p className="text-soft-text text-sm">Aucun historique disponible.</p>
            ) : (
              tradeHistory.map((trade, index) => (
                <div key={index} className="card-trader">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{trade.pair}</p>
                      <StatusBadge type={trade.type === "BUY" ? "profit" : "risk"}>
                        {trade.type}
                      </StatusBadge>
                    </div>
                    <p className={`text-lg font-bold tnum ${trade.profit > 0 ? "text-success" : "text-destructive"}`}>
                      {trade.profit > 0 ? "+" : ""}${trade.profit.toFixed(2)}
                    </p>
                  </div>
                  <p className="caption">{trade.date} • {trade.time}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Fixed CTA Button */}
      <div className="fixed bottom-6 left-6 right-6 z-20">
        <Button
          size="lg"
          className="w-full shadow-hover"
          onClick={() => navigate("/copy-config", { state: { masterId: id } })}
        >
          Copier ce trader
        </Button>
      </div>
    </div>
  );
};

export default function TraderProfile() {
  return (
    <ErrorBoundary>
      <TraderProfileContent />
    </ErrorBoundary>
  );
}
